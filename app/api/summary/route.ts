import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import type { SummaryResponse, SummaryRequest, APIErrorResponse } from "../../../types/api";

export const runtime = "nodejs";

// Model configuration
const MODEL = "facebook/bart-large-cnn";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const AI_TIMEOUT_MS = 30000;
const MAX_TEXT_LENGTH = 4000;
const MIN_TEXT_LENGTH = 50;

/**
 * Production-grade Summary API Route
 * Generates AI summaries using facebook/bart-large-cnn with retry logic
 */
export async function POST(req: Request): Promise<NextResponse<SummaryResponse | APIErrorResponse>> {
  const requestId = crypto.randomUUID();
  console.log(`[Summary-${requestId}] Starting summary generation`);

  try {
    // Parse and validate request body
    let payload: unknown;
    try {
      payload = await req.json();
    } catch (parseError) {
      console.warn(`[Summary-${requestId}] Invalid JSON in request body`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid request body", 
        details: "Request body must be valid JSON",
        code: "INVALID_JSON"
      }, { status: 400 });
    }

    // Type guard and validation
    if (!isSummaryRequest(payload)) {
      console.warn(`[Summary-${requestId}] Invalid request payload`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid request", 
        details: `Request must include 'text' field with at least ${MIN_TEXT_LENGTH} characters`,
        code: "INVALID_REQUEST"
      }, { status: 400 });
    }

    const { text, length = "medium" } = payload;

    // Strict text length validation
    if (text.trim().length < MIN_TEXT_LENGTH) {
      console.warn(`[Summary-${requestId}] Text too short: ${text.trim().length} chars`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Text too short", 
        details: `Please provide at least ${MIN_TEXT_LENGTH} characters of text to summarize`,
        code: "TEXT_TOO_SHORT"
      }, { status: 400 });
    }

    // Check API key
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error(`[Summary-${requestId}] Missing HUGGINGFACE_API_KEY`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Service configuration error", 
        details: "AI service is not properly configured",
        code: "CONFIGURATION_ERROR"
      }, { status: 500 });
    }

    const hf = new HfInference(apiKey);

    // Generate summary with retry logic
    let summary: string | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[Summary-${requestId}] Attempt ${attempt}/${MAX_RETRIES}`);
      
      try {
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI_TIMEOUT")), AI_TIMEOUT_MS)
        );

        // Generate summary
        const aiPromise = generateSummaryWithAI(hf, text, length);
        summary = await Promise.race([aiPromise, timeoutPromise]);
        
        console.log(`[Summary-${requestId}] Successfully generated summary on attempt ${attempt}`);
        break; // Success - exit retry loop
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Summary-${requestId}] Attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < MAX_RETRIES) {
          console.log(`[Summary-${requestId}] Retrying in ${RETRY_DELAY_MS * attempt}ms...`);
          await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
        }
      }
    }

    // If all retries failed
    if (!summary) {
      console.error(`[Summary-${requestId}] All ${MAX_RETRIES} attempts failed`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "AI service unavailable", 
        details: `Failed to generate summary after ${MAX_RETRIES} attempts. ${lastError?.message || ""}`,
        code: "AI_SERVICE_ERROR"
      }, { status: 503 });
    }

    // Success response
    return NextResponse.json<SummaryResponse>({ 
      summary: summary.trim(),
      metadata: {
        requestedLength: length,
        source: "AI-generated"
      }
    });

  } catch (error) {
    console.error(`[Summary-${requestId}] Unexpected error:`, error);
    return NextResponse.json<APIErrorResponse>({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

/**
 * Type guard for SummaryRequest
 */
function isSummaryRequest(payload: unknown): payload is SummaryRequest {
  if (typeof payload !== 'object' || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return typeof p.text === 'string' && 
         (p.length === undefined || ['short', 'medium', 'detailed'].includes(p.length as string));
}

/**
 * Generate summary using HuggingFace Inference API
 */
async function generateSummaryWithAI(hf: HfInference, text: string, length: string): Promise<string> {
  // Truncate text if too long
  const truncatedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) + "..." 
    : text;

  // Build prompt based on length preference
  let lengthInstruction: string;
  switch (length) {
    case "short":
      lengthInstruction = "Write a brief summary in 2-3 sentences.";
      break;
    case "detailed":
      lengthInstruction = "Write a comprehensive summary with multiple paragraphs.";
      break;
    default:
      lengthInstruction = "Write a standard summary in 5-7 sentences.";
  }

  const prompt = `${lengthInstruction} Summarize the following text:

Text: "${truncatedText}"

Provide a clear, concise summary that captures the main points.`;

  console.log(`[Summary] Calling HuggingFace API with model: ${MODEL}`);
  console.log(`[Summary] Prompt length: ${prompt.length} characters`);

  const response = await hf.textGeneration({
    model: MODEL,
    inputs: prompt,
    parameters: {
      max_new_tokens: 512,
      temperature: 0.7,
      return_full_text: false
    }
  });

  const generatedText = (response as any).generated_text;
  if (!generatedText || typeof generatedText !== 'string') {
    throw new Error("AI returned empty or invalid response");
  }

  console.log(`[Summary] Generated ${generatedText.length} characters`);
  return generatedText.trim();
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
