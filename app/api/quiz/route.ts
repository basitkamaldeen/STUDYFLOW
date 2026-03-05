import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import type { QuizResponse, QuizRequest, QuizQuestion, APIErrorResponse } from "../../../types/api";

export const runtime = "nodejs";

// Model and configuration
const MODEL = "google/flan-t5-base";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const AI_TIMEOUT_MS = 45000;
const MAX_TEXT_LENGTH = 4000;
const MIN_TEXT_LENGTH = 60;
const MAX_QUESTIONS = 20;
const MIN_QUESTIONS = 1;

// Simple in-memory rate limiting (per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

/**
 * Production-grade Quiz API Route
 * Generates AI-powered quiz questions using google/flan-t5-base with retry logic
 */
export async function POST(req: Request): Promise<NextResponse<QuizResponse | APIErrorResponse>> {
  const requestId = crypto.randomUUID();
  console.log(`[Quiz-${requestId}] Starting quiz generation`);

  try {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(clientIp);
    if (!rateLimitResult.allowed) {
      console.warn(`[Quiz-${requestId}] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Rate limit exceeded", 
        details: `Too many requests. Please try again in ${Math.ceil(rateLimitResult.retryAfter / 1000)} seconds`,
        code: "RATE_LIMIT_EXCEEDED"
      }, { status: 429 });
    }

    // Parse and validate request body
    let payload: unknown;
    try {
      payload = await req.json();
    } catch (parseError) {
      console.warn(`[Quiz-${requestId}] Invalid JSON in request body`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid request body", 
        details: "Request body must be valid JSON",
        code: "INVALID_JSON"
      }, { status: 400 });
    }

    // Type guard and validation
    if (!isQuizRequest(payload)) {
      console.warn(`[Quiz-${requestId}] Invalid request payload`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid request", 
        details: `Request must include 'text' field with at least ${MIN_TEXT_LENGTH} characters`,
        code: "INVALID_REQUEST"
      }, { status: 400 });
    }

    const { 
      text, 
      difficulty = "medium", 
      count = 5,
      saveToNotes = false 
    } = payload;

    // Validate text length
    if (text.trim().length < MIN_TEXT_LENGTH) {
      console.warn(`[Quiz-${requestId}] Text too short: ${text.trim().length} chars`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Text too short", 
        details: `Please provide at least ${MIN_TEXT_LENGTH} characters of text to generate meaningful quiz questions`,
        code: "TEXT_TOO_SHORT"
      }, { status: 400 });
    }

    // Validate question count
    if (count < MIN_QUESTIONS || count > MAX_QUESTIONS) {
      console.warn(`[Quiz-${requestId}] Invalid question count: ${count}`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid question count", 
        details: `Question count must be between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}`,
        code: "INVALID_COUNT"
      }, { status: 400 });
    }

    // Check API key
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error(`[Quiz-${requestId}] Missing HUGGINGFACE_API_KEY`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Service configuration error", 
        details: "AI service is not properly configured",
        code: "CONFIGURATION_ERROR"
      }, { status: 500 });
    }

    const hf = new HfInference(apiKey);

    // Get user if saving to notes
    let userId: string | null = null;
    if (saveToNotes) {
      try {
        userId = getCurrentUser(req as any);
      } catch {
        console.warn(`[Quiz-${requestId}] User not authenticated, skipping save to notes`);
      }
    }

    // Generate quiz with retry logic
    let questions: QuizQuestion[] | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[Quiz-${requestId}] Attempt ${attempt}/${MAX_RETRIES}`);
      
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI_TIMEOUT")), AI_TIMEOUT_MS)
        );

        // Generate quiz
        const aiPromise = generateQuizWithAI(hf, text, difficulty, count);
        questions = await Promise.race([aiPromise, timeoutPromise]);
        
        // Validate questions structure
        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error("AI returned empty or invalid question array");
        }

        console.log(`[Quiz-${requestId}] Successfully generated ${questions.length} questions on attempt ${attempt}`);
        break; // Success - exit retry loop
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Quiz-${requestId}] Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < MAX_RETRIES) {
          console.log(`[Quiz-${requestId}] Retrying in ${RETRY_DELAY_MS * attempt}ms...`);
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    // If all retries failed
    if (!questions || questions.length === 0) {
      console.error(`[Quiz-${requestId}] All ${MAX_RETRIES} attempts failed`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "AI service unavailable", 
        details: `Failed to generate quiz after ${MAX_RETRIES} attempts. ${lastError?.message || ""}`,
        code: "AI_SERVICE_ERROR"
      }, { status: 503 });
    }

    // Save to notes if requested and user is authenticated
    if (saveToNotes && userId) {
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
        console.log(`[Quiz-${requestId}] Saved quiz to notes for user ${userId}`);
      } catch (noteErr) {
        console.error(`[Quiz-${requestId}] Failed to save to notes:`, noteErr);
        // Don't fail the request if saving to notes fails
      }
    }

    // Success response
    return NextResponse.json<QuizResponse>({
      questions: questions.slice(0, count),
      metadata: {
        difficulty,
        requestedCount: count,
        actualCount: questions.length,
        source: "AI-generated"
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

/**
 * Type guard for QuizRequest
 */
function isQuizRequest(payload: unknown): payload is QuizRequest {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  
  const hasValidText = typeof p.text === 'string' && p.text.trim().length >= MIN_TEXT_LENGTH;
  const hasValidDifficulty = p.difficulty === undefined || ['easy', 'medium', 'hard'].includes(p.difficulty as string);
  const hasValidCount = p.count === undefined || (typeof p.count === 'number' && p.count >= MIN_QUESTIONS && p.count <= MAX_QUESTIONS);
  
  return hasValidText && hasValidDifficulty && hasValidCount;
}

/**
 * Check rate limit for client
 */
function checkRateLimit(clientIp: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const clientData = rateLimitMap.get(clientIp);

  if (!clientData || now > clientData.resetTime) {
    // New window
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    return { allowed: false, retryAfter: clientData.resetTime - now };
  }

  // Increment counter
  clientData.count++;
  return { allowed: true, retryAfter: 0 };
}

/**
 * Generate quiz using HuggingFace Inference API
 */
async function generateQuizWithAI(hf: HfInference, text: string, difficulty: string, count: number): Promise<QuizQuestion[]> {
  const truncatedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) + "..." 
    : text;

  const prompt = `Generate ${count} multiple-choice quiz questions from this text at ${difficulty} difficulty level.

Text: "${truncatedText}"

Return ONLY a JSON array with this exact format:
[
  {
    "question": "What is the main concept discussed?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0,
    "explanation": "Brief explanation why this is correct"
  }
]

Make questions test comprehension, include plausible distractors, and ensure the correct answer is clearly supported by the text.`;

  console.log(`[Quiz] Calling HuggingFace API with model: ${MODEL}`);
  console.log(`[Quiz] Generating ${count} questions at ${difficulty} difficulty`);

  const response = await hf.textGeneration({
    model: MODEL,
    inputs: prompt,
    parameters: {
      max_new_tokens: 1024,
      temperature: 0.8,
      return_full_text: false
    }
  });

  const generatedText = (response as any).generated_text;
  if (!generatedText || typeof generatedText !== 'string') {
    throw new Error("AI returned empty or invalid response");
  }

  // Parse JSON from response
  const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not parse AI response as JSON");
  }

  try {
    const questions = JSON.parse(jsonMatch[0]) as QuizQuestion[];
    
    // Validate each question
    if (!Array.isArray(questions)) {
      throw new Error("AI response is not an array");
    }

    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || typeof q.answer !== 'number') {
        throw new Error("Invalid question structure in AI response");
      }
    }

    console.log(`[Quiz] Successfully parsed ${questions.length} questions`);
    return questions;
  } catch (parseError) {
    console.error("[Quiz] JSON parse error:", parseError);
    throw new Error("Failed to parse AI response");
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
