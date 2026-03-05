"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "../components/Card";
import { Button } from "../components/ui/button";
import PageHeader from "../components/PageHeader";

interface SummaryOutputProps {
  summary: string;
  onCopy: () => void;
  onGenerateQuiz: () => void;
  onSaveToNotes: () => void;
}

function SummaryOutput({ summary, onCopy, onGenerateQuiz, onSaveToNotes }: SummaryOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  };

  return (
    <Card title="Summary Output">
      {summary ? (
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{summary}</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="w-full"
            >
              {copied ? "Copied!" : "Copy Summary"}
            </Button>
            <Button
              onClick={onGenerateQuiz}
              className="w-full"
            >
              Generate Quiz from This
            </Button>
            <Button
              onClick={onSaveToNotes}
              variant="secondary"
              className="w-full"
            >
              Save to Notes
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-center">Summary will appear here after you generate one.</p>
        </div>
      )}
    </Card>
  );
}

function SummarizePageContent() {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "detailed">("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle text from OCR page
  useEffect(() => {
    const textFromOCR = searchParams.get('text');
    if (textFromOCR) {
      setInputText(decodeURIComponent(textFromOCR));
    }
  }, [searchParams]);

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      setSummary("Please enter some text to summarize.");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: inputText,
          length: summaryLength 
        }),
      });
      const data = await response.json();
      
      if (data.summary) {
        setSummary(data.summary);
      } else {
        setSummary("Summary could not be generated. Please try again with different text.");
      }
    } catch (error) {
      console.error('Summary error:', error);
      setSummary("Error generating summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuiz = () => {
    if (summary) {
      router.push(`/quiz?text=${encodeURIComponent(summary)}`);
    }
  };

  const handleSaveToNotes = async () => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: summary,
          type: 'summary',
          originalText: inputText
        })
      });

      if (response.ok) {
        setSaveStatus("Saved to notes successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("Failed to save to notes. Please try again.");
      }
    } catch (error) {
      console.error('Save to notes error:', error);
      setSaveStatus("Error saving to notes. Please try again.");
    }
  };

  const handleCopy = () => {
    // Copy feedback handled in SummaryOutput component
  };

  const getLengthDescription = (length: string) => {
    switch (length) {
      case 'short':
        return "Brief bullet points (2-3 sentences)";
      case 'medium':
        return "Standard paragraph (5-7 sentences)";
      case 'detailed':
        return "Comprehensive summary (multiple paragraphs)";
      default:
        return "";
    }
  };

  const getTextStats = () => {
    const words = inputText.trim().split(/\s+/).filter(word => word.length > 0).length;
    const chars = inputText.length;
    const readingTime = Math.ceil(words / 200); // Average reading speed
    
    return { words, chars, readingTime };
  };

  const textStats = getTextStats();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader 
        title="Summarize Notes" 
        description="Transform lengthy notes into concise summaries with AI"
      />

      <div className="grid lg:grid-cols-2 gap-8">
        <Card title="Input Text">
          <div className="space-y-4">
            {/* Text Input */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or type your notes here..."
                className="w-full h-64 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                {textStats.words} words • {textStats.readingTime} min read
              </div>
            </div>

            {/* Summary Length Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Summary Length</label>
              <div className="grid grid-cols-3 gap-2">
                {(['short', 'medium', 'detailed'] as const).map((length) => (
                  <Button
                    key={length}
                    onClick={() => setSummaryLength(length)}
                    variant={summaryLength === length ? "default" : "outline"}
                    size="sm"
                    className="relative"
                  >
                    {length.charAt(0).toUpperCase() + length.slice(1)}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500">{getLengthDescription(summaryLength)}</p>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleSummarize} 
              className="w-full" 
              disabled={!inputText.trim() || isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Summary...
                </>
              ) : (
                "Generate Summary"
              )}
            </Button>

            {/* Text Statistics */}
            {inputText && (
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{textStats.words}</div>
                  <div className="text-xs text-gray-600">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{textStats.chars}</div>
                  <div className="text-xs text-gray-600">Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{textStats.readingTime}m</div>
                  <div className="text-xs text-gray-600">Reading Time</div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <SummaryOutput
          summary={summary}
          onCopy={handleCopy}
          onGenerateQuiz={handleGenerateQuiz}
          onSaveToNotes={handleSaveToNotes}
        />
      </div>

      {/* Save Status Notification */}
      {saveStatus && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {saveStatus}
        </div>
      )}
    </div>
  );
}

export default function SummarizePage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
            <div className="h-96 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    }>
      <SummarizePageContent />
    </Suspense>
  );
}