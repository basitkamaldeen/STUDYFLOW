import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { prisma } from "../../../lib/prisma";
import { getCurrentUserId } from "../../../lib/auth";
import type { QuizResponse, QuizRequest, QuizQuestion, APIErrorResponse } from "../../../types/api";

export const runtime = "nodejs";

// Use models that are available on free tier
// Llama models require chatCompletion, not textGeneration
const MODELS = [
  "meta-llama/Llama-3.2-1B-Instruct",  // ✅ Works with chatCompletion
  "mistralai/Mistral-7B-Instruct-v0.1", // ✅ Works with chatCompletion
  "google/flan-t5-base",                // ✅ Works with textGeneration
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const AI_TIMEOUT_MS = 45000;
const MAX_TEXT_LENGTH = 4000;
const MIN_TEXT_LENGTH = 60;
const MAX_QUESTIONS = 20;
const MIN_QUESTIONS = 1;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 10;

export async function POST(req: Request): Promise<NextResponse<QuizResponse | APIErrorResponse>> {
  const requestId = crypto.randomUUID();
  console.log(`[Quiz-${requestId}] Starting quiz generation`);

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Rate limit exceeded", 
        details: `Too many requests. Try again in ${Math.ceil(rateLimitResult.retryAfter / 1000)} seconds`,
        code: "RATE_LIMIT_EXCEEDED"
      }, { status: 429 });
    }

    // Parse request
    let payload: unknown;
    try {
      payload = await req.json();
    } catch (parseError) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid request body", 
        details: "Request body must be valid JSON",
        code: "INVALID_JSON"
      }, { status: 400 });
    }

    if (!isQuizRequest(payload)) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid request", 
        details: `Request must include 'text' field with at least ${MIN_TEXT_LENGTH} characters`,
        code: "INVALID_REQUEST"
      }, { status: 400 });
    }

    const { text, difficulty = "medium", count = 5, saveToNotes = false } = payload;

    if (text.trim().length < MIN_TEXT_LENGTH) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Text too short", 
        details: `Please provide at least ${MIN_TEXT_LENGTH} characters`,
        code: "TEXT_TOO_SHORT"
      }, { status: 400 });
    }

    if (count < MIN_QUESTIONS || count > MAX_QUESTIONS) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid question count", 
        details: `Question count must be between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}`,
        code: "INVALID_COUNT"
      }, { status: 400 });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error(`[Quiz-${requestId}] Missing HUGGINGFACE_API_KEY`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Service configuration error", 
        details: "AI service is not properly configured. Please add HUGGINGFACE_API_KEY to your environment variables.",
        code: "CONFIGURATION_ERROR"
      }, { status: 500 });
    }

    const hf = new HfInference(apiKey);

    // Get user if saving to notes
    let userId: string | null = null;
    if (saveToNotes) {
      try {
        userId = await getCurrentUserId(req as any);
      } catch {
        console.warn(`[Quiz-${requestId}] User not authenticated, skipping save`);
      }
    }

    // Generate quiz with retry logic
    let questions: QuizQuestion[] | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[Quiz-${requestId}] Attempt ${attempt}/${MAX_RETRIES}`);
      
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI_TIMEOUT")), AI_TIMEOUT_MS)
        );

        const aiPromise = generateQuizWithAI(hf, text, difficulty, count);
        questions = await Promise.race([aiPromise, timeoutPromise]);
        
        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error("AI returned empty or invalid question array");
        }

        console.log(`[Quiz-${requestId}] Successfully generated ${questions.length} questions`);
        break;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Quiz-${requestId}] Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    // Use fallback if AI failed
    if (!questions || questions.length === 0) {
      console.log(`[Quiz-${requestId}] Using fallback generation`);
      questions = generateFallbackQuiz(text, difficulty, count);
    }

    // Save to notes if requested
    if (saveToNotes && userId && questions) {
      try {
        const titleWords = text.split(/\s+/).slice(0, 6);
        const finalTitle = `Quiz: ${titleWords.join(' ')}${titleWords.length < text.split(/\s+/).length ? '...' : ''}`;
        
        await prisma.note.create({
          data: {
            userId,
            type: 'quiz',
            content: JSON.stringify(questions),
            originalText: text,
            title: finalTitle
          }
        });
        console.log(`[Quiz-${requestId}] Saved quiz to notes`);
      } catch (noteErr) {
        console.error(`[Quiz-${requestId}] Failed to save to notes:`, noteErr);
      }
    }

    return NextResponse.json<QuizResponse>({
      questions: questions.slice(0, count),
      metadata: {
        difficulty,
        requestedCount: count,
        actualCount: questions.length,
        source: questions.length === count ? "AI-generated" : "AI-generated with fallback"
      }
    });

  } catch (error) {
    console.error(`[Quiz-${requestId}] Unexpected error:`, error);
    return NextResponse.json<APIErrorResponse>({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

function isQuizRequest(payload: unknown): payload is QuizRequest {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  
  const hasValidText = typeof p.text === 'string' && p.text.trim().length >= MIN_TEXT_LENGTH;
  const hasValidDifficulty = p.difficulty === undefined || ['easy', 'medium', 'hard'].includes(p.difficulty as string);
  const hasValidCount = p.count === undefined || (typeof p.count === 'number' && p.count >= MIN_QUESTIONS && p.count <= MAX_QUESTIONS);
  
  return hasValidText && hasValidDifficulty && hasValidCount;
}

function checkRateLimit(clientIp: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIp);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: clientData.resetTime - now };
  }

  clientData.count++;
  return { allowed: true, retryAfter: 0 };
}

async function generateQuizWithAI(hf: HfInference, text: string, difficulty: string, count: number): Promise<QuizQuestion[]> {
  const truncatedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) + "..." 
    : text;

  const prompt = `Generate ${count} multiple-choice quiz questions about this text at ${difficulty} difficulty level.

Text: "${truncatedText}"

Return ONLY a JSON array with this exact format:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Brief explanation"
  }
]`;

  let lastError: Error | null = null;
  
  // Try each model in sequence
  for (const model of MODELS) {
    try {
      console.log(`[Quiz] Trying model: ${model}`);
      
      let response: any;
      
      // Check if it's a conversational model (Llama, Mistral) or text generation model (Flan)
      if (model.includes("llama") || model.includes("mistral")) {
        // Use chatCompletion for conversational models
        response = await hf.chatCompletion({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that generates quiz questions. Always return valid JSON."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1024,
          temperature: 0.7,
        });
        
        const generatedText = response.choices[0]?.message?.content;
        if (!generatedText) continue;
        
        // Extract JSON
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          if (Array.isArray(questions) && questions.length > 0) {
            console.log(`[Quiz] Success with model: ${model}`);
            return questions;
          }
        }
      } else {
        // Use textGeneration for other models
        response = await hf.textGeneration({
          model: model,
          inputs: prompt,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            return_full_text: false
          }
        });

        const generatedText = (response as any).generated_text;
        if (!generatedText) continue;

        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0]);
          if (Array.isArray(questions) && questions.length > 0) {
            console.log(`[Quiz] Success with model: ${model}`);
            return questions;
          }
        }
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[Quiz] Model ${model} failed:`, lastError.message);
      continue;
    }
  }
  
  throw lastError || new Error("All models failed to generate valid questions");
}

function generateFallbackQuiz(text: string, difficulty: string, count: number): QuizQuestion[] {
  console.log("[Quiz] Using fallback generation");
  
  const questions: QuizQuestion[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const sentence = sentences[i].trim();
    const words = sentence.split(' ').filter(w => w.length > 3);
    
    if (words.length < 2) continue;
    
    questions.push({
      question: `What does the text say about "${words[0]} ${words[1]}"?`,
      options: [
        sentence.substring(0, 80),
        "The opposite of what is stated",
        "Information not mentioned in the text",
        "None of the above"
      ],
      answer: 0,
      explanation: `Based on the text: "${sentence.substring(0, 100)}..."`
    });
  }
  
  while (questions.length < count && questions.length < 5) {
    questions.push({
      question: "What is the main topic of this text?",
      options: ["The subject matter discussed", "An unrelated topic", "A fictional story", "None of the above"],
      answer: 0,
      explanation: "The main topic is what the text primarily discusses."
    });
  }
  
  return questions.slice(0, count);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
