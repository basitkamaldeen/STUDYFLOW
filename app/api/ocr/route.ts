import { NextRequest, NextResponse } from "next/server";
import type { OCRResponse, APIErrorResponse } from "../../../types/api";

export const runtime = "nodejs";

// Constants for validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
const OCR_TIMEOUT_MS = 60000; // 60 seconds
const MIN_TEXT_LENGTH = 5;

/**
 * Production-grade OCR API Route
 * Extracts text from images using Tesseract.js with strict validation
 */
export async function POST(req: NextRequest): Promise<NextResponse<OCRResponse | APIErrorResponse>> {
  const requestId = crypto.randomUUID();
  console.log(`[OCR-${requestId}] Starting OCR request`);

  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      console.warn(`[OCR-${requestId}] No image file provided`);
      return NextResponse.json<APIErrorResponse>({
        error: "No image uploaded",
        details: "Please provide an image file in the 'image' field",
        code: "MISSING_FILE"
      }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      console.warn(`[OCR-${requestId}] Invalid file type: ${file.type}`);
      return NextResponse.json<APIErrorResponse>({
        error: "Invalid file type",
        details: `Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        code: "INVALID_FILE_TYPE"
      }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      console.warn(`[OCR-${requestId}] File too large: ${file.size} bytes`);
      return NextResponse.json<APIErrorResponse>({
        error: "Image too large",
        details: `Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        code: "FILE_TOO_LARGE"
      }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json<APIErrorResponse>({
        error: "Empty file",
        details: "The uploaded file appears to be empty",
        code: "EMPTY_FILE"
      }, { status: 400 });
    }

    let extractedText = "";

    try {
      const Tesseract = await import("tesseract.js");

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("OCR_TIMEOUT")), OCR_TIMEOUT_MS)
      );

      // 🔥 FIXED TESSERACT WORKER CONFIG
      const ocrPromise = Tesseract.recognize(file, "eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text") {
            console.log(
              `[OCR-${requestId}] Progress: ${Math.round(m.progress * 100)}%`
            );
          }
        },
        workerPath:
          "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
        corePath:
          "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js",
      }).then((result) => result.data.text);

      extractedText = await Promise.race([ocrPromise, timeoutPromise]);

      extractedText = cleanExtractedText(extractedText);

      if (extractedText.length < MIN_TEXT_LENGTH) {
        console.warn(`[OCR-${requestId}] Insufficient text extracted: ${extractedText.length} chars`);
        return NextResponse.json<OCRResponse>({
          text: "No readable text could be extracted from this image. Please ensure the image contains clear, readable text and try again.",
          success: false,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            textLength: 0
          }
        }, { status: 200 });
      }

      console.log(`[OCR-${requestId}] Successfully extracted ${extractedText.length} characters`);

    } catch (ocrError) {
      console.error(`[OCR-${requestId}] OCR processing error:`, ocrError);

      if (ocrError instanceof Error && ocrError.message === "OCR_TIMEOUT") {
        return NextResponse.json<OCRResponse>({
          text: "OCR processing timed out. The image may be too complex or large. Please try with a simpler image.",
          success: false,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            textLength: 0
          }
        }, { status: 200 });
      }

      return NextResponse.json<OCRResponse>({
        text: "OCR processing failed. Please ensure the image contains clear, readable text and try again.",
        success: false,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          textLength: 0
        }
      }, { status: 200 });
    }

    return NextResponse.json<OCRResponse>({
      text: extractedText,
      success: true,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        textLength: extractedText.length
      }
    });

  } catch (error) {
    console.error(`[OCR-${requestId}] Unexpected API error:`, error);
    return NextResponse.json<APIErrorResponse>({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "An unexpected error occurred",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/[^\w\s.,!?;:()\-\n]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
L