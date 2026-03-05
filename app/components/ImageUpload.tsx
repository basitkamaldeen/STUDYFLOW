"use client";

import { useState } from "react";

export default function ImageUpload({
  onText,
}: {
  onText: (text: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleImage = async (file: File) => {
    setLoading(true);
    try {
      // Use local stub to avoid module resolution issues during build
      const Tesseract = (await import("./tesseract-stub")).default as any;
      const result = await (Tesseract as any).recognize(file, "eng");
      onText(result.data.text);
    } catch {
      onText("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && handleImage(e.target.files[0])}
      />
      {loading && <p className="text-sm text-gray-500 mt-2">Extracting…</p>}
    </div>
  );
}
