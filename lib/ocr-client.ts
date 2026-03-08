// Client-side OCR processing using Tesseract.js
export async function performOCR(file: File): Promise<string> {
  try {
    console.log("Loading Tesseract.js in browser...");
    
    // Dynamic import in browser context
    const Tesseract = await import("tesseract.js");
    
    console.log("Starting OCR recognition...");
    
    const result = await Tesseract.recognize(file, "eng", {
      logger: (m: any) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    console.log("OCR completed successfully");
    return result.data.text || "";
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
