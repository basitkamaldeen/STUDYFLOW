// lib/validators.ts
export function requireText(text: string) {
  if (!text || text.trim() === "") throw new Error("Text input required");
}

export function requireFile(file: File | null) {
  if (!file) throw new Error("File input required");
}
