"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import { Button } from "../components/ui/button";

type RecognitionLike = any;

export default function SpeechPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Browser support check
  const isBrowserSupported = isMounted && typeof window !== "undefined" &&
    (("SpeechRecognition" in (window as any)) || ("webkitSpeechRecognition" in (window as any)));

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState<string>("en-US");
  const [finalTranscript, setFinalTranscript] = useState<string>(""); // accumulated finalized text
  const [interimTranscript, setInterimTranscript] = useState<string>(""); // live interim text
  const [status, setStatus] = useState<string>("No speech detected"); // UI status text
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  // Recognition instance refs
  const recognitionRef = useRef<RecognitionLike | null>(null);

  // Word/char counts
  const wordCount = useMemo(() => {
    const text = finalTranscript.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }, [finalTranscript]);

  const charCount = useMemo(() => finalTranscript.replace(/\s/g, "").length, [finalTranscript]);

  // Initialize or get SpeechRecognition instance
  const ensureRecognition = (): RecognitionLike | null => {
    if (!isBrowserSupported) {
      setError("SpeechRecognition API is not supported by this browser.");
      return null;
    }
    const Win = window as any;
    const Rec = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!Rec) {
      setError("SpeechRecognition is not available in this browser.");
      return null;
    }
    const rec: RecognitionLike = new Rec();
    // Basic config
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = language;

    // End handling: auto-restart if it ends while recording
    rec.onend = () => {
      if (isRecording) {
        setTimeout(() => {
          try {
            rec.start();
            setStatus("Listening…");
          } catch {
            // ignore
          }
        }, 250);
      }
    };

    // Result handling: accumulate final results and show interim
    rec.onresult = (event: any) => {
      let interim = "";
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0]?.transcript ?? "";
        if (res.isFinal) {
          finalChunk += transcript;
        } else {
          interim = transcript;
        }
      }
      if (interim) {
        setInterimTranscript((prev) => (interim ? interim : prev));
      }
      if (finalChunk) {
        // Append finalized chunks to the main textarea content
        setFinalTranscript((prev) => (prev ? prev + finalChunk : finalChunk) + " ");
        setInterimTranscript(""); // interim cleared after final
      }
    };

    rec.onerror = (e: any) => {
      const err = e?.error || e?.message || "";
      let msg = "Speech recognition error.";

      if (err === "no-speech") msg = "No speech detected. Try speaking clearly.";
      else if (err === "audio-capture" || err === "not-allowed") {
        msg = "Microphone access denied or not allowed.";
        setPermissionDenied(true);
      } else if (err === "network") msg = "Network error. Check connection.";
      else if (err === "aborted") msg = "Speech recognition aborted.";
      else if (typeof err === "string" && err.length > 0) msg = err;

      setError(msg);
      if (err === "not-allowed" || err === "aborted") {
        setPermissionDenied(true);
      }
    };

    recognitionRef.current = rec;
    return rec;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec && typeof (rec as any).stop === "function") {
        try {
          (rec as any).stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Apply language changes to existing recognizer
  useEffect(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.lang = language;
      // If language changed while recording, restart to apply new language
      if (isRecording) {
        try {
          (rec as any).stop();
        } catch {
          // ignore
        }
      }
    }
  }, [language]);

  // Start recording
  const startRecording = () => {
    if (isRecording) return;
    const rec = recognitionRef.current ?? ensureRecognition();
    if (!rec) return;
    setInterimTranscript("");
    setError(null);
    setStatus("Listening…");
    try {
      (rec as any).start();
      setIsRecording(true);
      setPermissionDenied(false);
    } catch {
      setError("Unable to start recognition. Permission may be denied.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!isRecording) return;
    const rec = recognitionRef.current;
    if (rec && typeof (rec as any).stop === "function") {
      try {
        (rec as any).stop();
      } catch {
        // ignore
      }
    }
    setIsRecording(false);
    setStatus(finalTranscript.length > 0 || interimTranscript.length > 0 ? "Ready" : "No speech detected");
    setInterimTranscript("");
  };

  // UI helpers
  const clearText = () => {
    setFinalTranscript("");
    setInterimTranscript("");
    setStatus("No speech detected");
  };

  const copyToClipboard = async () => {
    if (!finalTranscript) return;
    try {
      await navigator.clipboard?.writeText(finalTranscript);
    } catch {
      // ignore
    }
  };

  const downloadTxt = () => {
    if (!finalTranscript) return;
    const blob = new Blob([finalTranscript], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "transcript.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const saveNote = () => {
    const text = finalTranscript.trim();
    if (!text) return;
    const entry = { timestamp: Date.now(), language, text };
    const existing = JSON.parse(localStorage.getItem("speechNotes") || "[]");
    existing.unshift(entry);
    localStorage.setItem("speechNotes", JSON.stringify(existing));
    // UX cue
    setStatus("Note saved");
    setTimeout(() => {
      setStatus(finalTranscript.length > 0 || interimTranscript.length > 0 ? "Listening…" : "No speech detected");
    }, 1200);
  };

  // Derived UI content
  const interimPreview = interimTranscript?.trim();
  const finalPreview = finalTranscript;

  // Start with permission check messaging
  useEffect(() => {
    if (permissionDenied) {
      setError("Microphone access was denied. Please grant permission in your browser settings.");
    }
  }, [permissionDenied]);

  // Basic supported fallback UI state
  if (!isBrowserSupported) {
    return (
      <div className="p-4">
        <Card title="Speech to Text">
          <div className="text-sm text-red-600">This browser does not support the Web Speech API. Please try a modern browser (Chrome/Edge/Firefox) with mic access.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Speech to Text</h1>

      <Card title="Live Transcription">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs text-gray-500">Status</span>
              <span
                className={
                  "px-2 py-1 rounded-full text-xs " +
                  (isRecording ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")
                }
              >
                {isRecording ? "Listening…" : (finalTranscript || interimTranscript ? "Ready" : "No speech detected")}
              </span>
              {permissionDenied && (
                <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Permission denied</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Large animated mic indicator */}
              <div
                aria-label={isRecording ? "Recording" : "Idle"}
                className={
                  "h-28 w-28 rounded-full flex items-center justify-center " +
                  (isRecording ? "bg-red-500 ring-4 ring-red-300 animate-pulse" : "bg-gray-200/70")
                }
              >
                <div
                  className={
                    "h-16 w-16 rounded-full bg-white " + (isRecording ? "animate-ping" : "")
                  }
                />
              </div>

              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">Language</div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border rounded-md px-2 py-1 text-sm"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="ja-JP">Japanese</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-start">
            <Button onClick={startRecording} className="w-full" disabled={isRecording}>
              Start
            </Button>
            <Button onClick={stopRecording} className="w-full" disabled={!isRecording}>
              Stop
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <Button onClick={clearText} className="w-full" disabled={!finalTranscript && !interimTranscript}>
            Clear Text
          </Button>
          <Button onClick={copyToClipboard} className="w-full" disabled={!finalTranscript}>
            Copy
          </Button>
          <Button onClick={downloadTxt} className="w-full" disabled={!finalTranscript}>
            Download .txt
          </Button>
          <Button onClick={saveNote} className="w-full" disabled={!finalTranscript}>
            Save as Note
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative min-h-[140px] border rounded-lg p-3 bg-white">
            <div className="absolute -top-2 left-3 bg-white px-2 text-xs text-gray-600">Final Transcript</div>
            <textarea
              value={finalTranscript}
              onChange={(e) => setFinalTranscript(e.target.value)}
              className="w-full h-40 border-0 resize-none outline-none text-base"
              spellCheck={false}
            />
          </div>

          <div className="min-h-[140px] border rounded-lg p-3 bg-white">
            <div className="text-sm text-gray-600 mb-2">Live Transcript (interim)</div>
            <div className="text-gray-500 italic" style={{ minHeight: 100 }}>
              {interimPreview ? interimPreview : isRecording ? "Listening…" : "No speech detected"}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          <span className="mr-4">Words: {wordCount}</span>
          <span>Chars: {charCount}</span>
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-600">Error: {error}</div>
        )}
      </Card>

      <Card title="How it works">
        <p className="text-sm text-gray-700">
          This UI uses the Web Speech API to perform continuous speech recognition in your browser. It supports live interim results, non-destructive final text accumulation, and robust error handling for unsupported browsers, denied permissions, and common recognition errors.
        </p>
      </Card>
    </div>
  );
}
