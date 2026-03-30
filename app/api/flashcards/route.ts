import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/auth";
import type { FlashcardsResponse, FlashcardsRequest, Flashcard, APIErrorResponse } from "../../../types/api";

export const runtime = "nodejs";

// Model priority - Llama works best for structured JSON output
const MODELS = [
  "meta-llama/Llama-3.2-1B-Instruct",
  "meta-llama/Llama-3.2-3B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.1",
];

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;
const AI_TIMEOUT_MS = 60000; // Increased to 60 seconds
const MAX_TEXT_LENGTH = 4000;
const MIN_TEXT_LENGTH = 60;
const MAX_CARDS = 20;
const MIN_CARDS = 1;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 10;

export async function POST(req: Request): Promise<NextResponse<FlashcardsResponse | APIErrorResponse>> {
  const requestId = crypto.randomUUID();
  console.log(`[Flashcards-${requestId}] Starting flashcard generation`);

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

    if (!isFlashcardsRequest(payload)) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid request", 
        details: `Request must include 'text' field with at least ${MIN_TEXT_LENGTH} characters`,
        code: "INVALID_REQUEST"
      }, { status: 400 });
    }

    const { text, count = 10, saveToNotes = false } = payload;

    if (text.trim().length < MIN_TEXT_LENGTH) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Text too short", 
        details: `Please provide at least ${MIN_TEXT_LENGTH} characters to generate flashcards`,
        code: "TEXT_TOO_SHORT"
      }, { status: 400 });
    }

    if (count < MIN_CARDS || count > MAX_CARDS) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid card count", 
        details: `Card count must be between ${MIN_CARDS} and ${MAX_CARDS}`,
        code: "INVALID_COUNT"
      }, { status: 400 });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error(`[Flashcards-${requestId}] Missing HUGGINGFACE_API_KEY`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Service configuration error", 
        details: "AI service is not properly configured.",
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
        console.warn(`[Flashcards-${requestId}] User not authenticated, skipping save`);
      }
    }

    // Generate flashcards with retry logic
    let flashcards: Flashcard[] | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[Flashcards-${requestId}] Attempt ${attempt}/${MAX_RETRIES}`);
      
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI_TIMEOUT")), AI_TIMEOUT_MS)
        );

        const aiPromise = generateFlashcardsWithAI(hf, text, count, attempt);
        flashcards = await Promise.race([aiPromise, timeoutPromise]);
        
        if (!Array.isArray(flashcards) || flashcards.length === 0) {
          throw new Error("AI returned empty or invalid flashcards array");
        }

        console.log(`[Flashcards-${requestId}] Successfully generated ${flashcards.length} flashcards`);
        break;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Flashcards-${requestId}] Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * attempt;
          console.log(`[Flashcards-${requestId}] Retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    // Use fallback if AI failed
    if (!flashcards || flashcards.length === 0) {
      console.log(`[Flashcards-${requestId}] Using fallback generation`);
      flashcards = generateFallbackFlashcards(text, count);
    }

    // Ensure we return exactly the requested number of cards
    const finalFlashcards = flashcards.slice(0, count);
    
    // Validate each card has content
    const validatedCards = finalFlashcards.map(card => ({
      front: card.front?.trim() || "What is this concept?",
      back: card.back?.trim() || "Review the text for this concept."
    }));

    // Save to notes if requested
    if (saveToNotes && userId && validatedCards.length > 0) {
      try {
        const titleWords = text.split(/\s+/).slice(0, 6);
        const finalTitle = `Flashcards: ${titleWords.join(' ')}${titleWords.length < text.split(/\s+/).length ? '...' : ''}`;
        
        await prisma.note.create({
          data: {
            userId,
            type: 'flashcard',
            content: JSON.stringify(validatedCards),
            originalText: text,
            title: finalTitle
          }
        });
        console.log(`[Flashcards-${requestId}] Saved flashcards to notes`);
      } catch (noteErr) {
        console.error(`[Flashcards-${requestId}] Failed to save to notes:`, noteErr);
      }
    }

    return NextResponse.json<FlashcardsResponse>({
      cards: validatedCards,
      flashcards: validatedCards,
      metadata: {
        requestedCount: count,
        actualCount: validatedCards.length,
        source: validatedCards.length === count ? "AI-generated" : "AI-generated with fallback"
      }
    });

  } catch (error) {
    console.error(`[Flashcards-${requestId}] Unexpected error:`, error);
    return NextResponse.json<APIErrorResponse>({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

function isFlashcardsRequest(payload: unknown): payload is FlashcardsRequest {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  
  const hasValidText = typeof p.text === 'string' && p.text.trim().length >= MIN_TEXT_LENGTH;
  const hasValidCount = p.count === undefined || (typeof p.count === 'number' && p.count >= MIN_CARDS && p.count <= MAX_CARDS);
  
  return hasValidText && hasValidCount;
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

/**
 * Enhanced JSON extraction from AI responses
 * Handles various formats: markdown code blocks, explanatory text, malformed JSON
 */
function extractJSONFromResponse(text: string): any | null {
  if (!text || typeof text !== 'string') return null;
  
  // Strategy 1: Look for JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    const jsonStr = codeBlockMatch[1].trim();
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      // Fall through to other strategies
    }
  }
  
  // Strategy 2: Find the first [ and last ] - most common pattern
  let startIndex = text.indexOf('[');
  let endIndex = text.lastIndexOf(']');
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    let jsonStr = text.substring(startIndex, endIndex + 1);
    
    // Strategy 3: Attempt to fix common JSON issues
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      // Try progressive fixes
      const fixed = attemptJSONFix(jsonStr);
      if (fixed) return fixed;
    }
  }
  
  // Strategy 4: Look for array pattern with regex
  const arrayMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) {
      const fixed = attemptJSONFix(arrayMatch[0]);
      if (fixed) return fixed;
    }
  }
  
  return null;
}

/**
 * Attempt to fix common JSON formatting issues
 */
function attemptJSONFix(jsonStr: string): any | null {
  let fixed = jsonStr;
  
  // Remove trailing commas before } or ]
  fixed = fixed.replace(/,\s*}/g, '}');
  fixed = fixed.replace(/,\s*\]/g, ']');
  
  // Add quotes to unquoted property names
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');
  
  // Fix single quotes to double quotes
  fixed = fixed.replace(/'/g, '"');
  
  // Fix unescaped quotes within strings (simplified)
  fixed = fixed.replace(/(?<!\\)"(?![,:}\]])/g, '\\"');
  
  // Fix escaped quotes that shouldn't be escaped
  fixed = fixed.replace(/\\"/g, '"');
  
  try {
    return JSON.parse(fixed);
  } catch (e) {
    return null;
  }
}

/**
 * Validate a flashcard object
 */
function isValidFlashcard(card: unknown): card is Flashcard {
  if (!card || typeof card !== 'object') return false;
  const c = card as Record<string, unknown>;
  
  const hasFront = typeof c.front === 'string' && c.front.trim().length > 0;
  const hasBack = typeof c.back === 'string' && c.back.trim().length > 0;
  
  return hasFront && hasBack;
}

async function generateFlashcardsWithAI(
  hf: HfInference, 
  text: string, 
  count: number,
  attempt: number
): Promise<Flashcard[]> {
  const truncatedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) + "..." 
    : text;

  // Enhanced prompt with stricter formatting instructions
  const prompt = `Generate exactly ${count} flashcards from the text below.

IMPORTANT RULES:
1. Each flashcard must have a "front" (question or term) and a "back" (answer or definition)
2. The front should be a clear, specific question about key information
3. The back should provide the answer based directly on the text
4. Return ONLY a valid JSON array - no explanations, no markdown, no additional text

Text: "${truncatedText}"

Required JSON format:
[
  {"front": "Question 1?", "back": "Answer 1."},
  {"front": "Question 2?", "back": "Answer 2."}
]`;

  // Stricter system prompt for the first attempt, more lenient for retries
  const systemPrompt = attempt === 1 
    ? "You are a precise JSON generator. Return ONLY a valid JSON array of flashcards. Do not include any other text, markdown, or explanations."
    : "You are a helpful assistant that generates flashcards. Return a JSON array of flashcards. You may include minimal text before or after, but ensure the JSON is valid.";

  let lastError: Error | null = null;
  
  // Try each model in sequence
  for (const model of MODELS) {
    try {
      console.log(`[Flashcards] Trying model: ${model}`);
      
      let generatedText: string = "";
      
      // Check if it's a conversational model
      if (model.includes("llama") || model.includes("mistral")) {
        const response = await hf.chatCompletion({
          model: model,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 2048,
          temperature: attempt === 1 ? 0.5 : 0.7, // Lower temperature for first attempt
        });
        
        generatedText = response.choices[0]?.message?.content || "";
      } else {
        const response = await hf.textGeneration({
          model: model,
          inputs: prompt,
          parameters: {
            max_new_tokens: 2048,
            temperature: attempt === 1 ? 0.5 : 0.7,
            return_full_text: false
          }
        });

        generatedText = (response as any).generated_text || "";
      }
      
      if (!generatedText) {
        console.log(`[Flashcards] Model ${model} returned empty response`);
        continue;
      }
      
      console.log(`[Flashcards] Generated text length: ${generatedText.length}`);
      
      // Extract JSON using enhanced parser
      const parsed = extractJSONFromResponse(generatedText);
      
      if (parsed && Array.isArray(parsed)) {
        // Validate each flashcard
        const validFlashcards = parsed.filter(isValidFlashcard);
        
        if (validFlashcards.length > 0) {
          console.log(`[Flashcards] Success with model: ${model}, got ${validFlashcards.length} valid cards`);
          return validFlashcards;
        } else {
          console.log(`[Flashcards] Model ${model} returned ${parsed.length} cards but none were valid`);
          // Log first few invalid cards for debugging
          const invalidSamples = parsed.slice(0, 2);
          console.log(`[Flashcards] Invalid samples:`, JSON.stringify(invalidSamples));
        }
      } else {
        console.log(`[Flashcards] Could not extract valid JSON from model ${model}`);
        // Show first 300 chars for debugging
        const preview = generatedText.length > 300 
          ? generatedText.substring(0, 300) + "..." 
          : generatedText;
        console.log(`[Flashcards] Response preview: ${preview}`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`[Flashcards] Model ${model} failed:`, lastError.message);
      continue;
    }
  }
  
  throw lastError || new Error("All models failed to generate valid flashcards");
}

function generateFallbackFlashcards(text: string, count: number): Flashcard[] {
  console.log("[Flashcards] Using fallback generation");
  
  const flashcards: Flashcard[] = [];
  
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Create meaningful questions from sentences
  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const sentence = sentences[i].trim();
    if (sentence.length < 15) continue;
    
    // Extract key terms (words longer than 4 chars, not common words)
    const words = sentence.split(' ').filter(w => w.length > 4);
    const commonWords = new Set(['there', 'their', 'about', 'would', 'which', 'these', 'those', 'could', 'should', 'because']);
    
    const keyTerms = words.filter(w => !commonWords.has(w.toLowerCase().replace(/[^\w]/g, '')));
    
    if (keyTerms.length > 0) {
      const keyTerm = keyTerms[0].replace(/[^\w]/g, '');
      flashcards.push({
        front: `What does the text say about "${keyTerm}"?`,
        back: sentence.substring(0, 250)
      });
    } else {
      flashcards.push({
        front: `What is the main idea of this sentence?`,
        back: sentence.substring(0, 250)
      });
    }
  }
  
  // Add summary flashcards
  const firstParagraph = text.split('\n\n')[0] || text.substring(0, 300);
  flashcards.unshift({
    front: "What is the main topic of this text?",
    back: firstParagraph.substring(0, 250)
  });
  
  // Remove duplicates
  const uniqueFlashcards = flashcards.filter((card, index, self) =>
    index === self.findIndex(c => c.front === card.front)
  );
  
  // Ensure we have enough cards
  const genericCards: Flashcard[] = [
    { front: "What is the key takeaway from this text?", back: "Review the main points and important details from the text." },
    { front: "What important concept should you remember?", back: "Focus on the central ideas and supporting details presented." },
    { front: "How would you summarize this information?", back: "The text covers important concepts that require careful review and understanding." }
  ];
  
  let result = [...uniqueFlashcards];
  while (result.length < count && result.length < genericCards.length + uniqueFlashcards.length) {
    const card = genericCards[result.length % genericCards.length];
    result.push(card);
  }
  
  return result.slice(0, count);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}