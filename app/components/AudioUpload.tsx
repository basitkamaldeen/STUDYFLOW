"use client";

import { useState } from "react";

export default function AudioUpload({
  onText,
}: {
  onText: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);

  const start = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      onText(e.results[0][0].transcript);
      setListening(false);
    };

    recognition.start();
    setListening(true);
  };

  return (
    <button
      onClick={start}
      className="w-full bg-black text-white py-3 rounded-xl"
    >
      {listening ? "Listening…" : "Start Recording"}
    </button>
  );
}
