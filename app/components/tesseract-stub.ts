// Minimal OCR stub used when real tesseract.js is unavailable
const TesseractStub = {
  recognize: async (_file: any, _lang: string) => {
    // Return empty text by default to allow app to function without OCR library
    return { data: { text: "" } } as any;
  },
};

export default TesseractStub;
