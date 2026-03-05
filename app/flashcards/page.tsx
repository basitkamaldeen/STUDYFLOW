"use client";

import { useState, useEffect, Suspense } from "react";
import Card from "../components/Card";
import { Button } from "../components/ui/button";
import PageHeader from "../components/PageHeader";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardInterfaceProps {
  cards: Flashcard[];
  onRetry: () => void;
  onSaveToNotes: () => void;
}

function FlashcardInterface({ cards, onRetry, onSaveToNotes }: FlashcardInterfaceProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSaveToNotes = async () => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(cards),
          type: 'flashcard',
          title: `Flashcards: ${cards[0]?.front.substring(0, 30)}...`
        })
      });

      if (response.ok) {
        setSaveStatus("Saved to notes successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("Failed to save to notes");
      }
    } catch (error) {
      console.error('Save to notes error:', error);
      setSaveStatus("Error saving to notes");
    }
  };

  const card = cards[currentCard];

  return (
    <Card title={`Flashcard ${currentCard + 1} of ${cards.length}`}>
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCard + 1) / cards.length) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        <div className="relative h-64">
          <div
            className={`absolute inset-0 w-full h-full transition-all duration-500 transform-gpu cursor-pointer ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            onClick={handleFlip}
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl flex items-center justify-center p-8 backface-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="text-white text-center">
                <div className="text-sm font-medium mb-2 opacity-75">Question</div>
                <div className="text-xl font-semibold leading-relaxed">
                  {card.front}
                </div>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl shadow-xl flex items-center justify-center p-8"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
            >
              <div className="text-white text-center">
                <div className="text-sm font-medium mb-2 opacity-75">Answer</div>
                <div className="text-xl font-semibold leading-relaxed">
                  {card.back}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentCard === 0}
            className="flex-1"
          >
            Previous
          </Button>

          <Button
            onClick={handleFlip}
            variant="secondary"
            className="flex-1"
          >
            {isFlipped ? "Show Question" : "Show Answer"}
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentCard === cards.length - 1}
            className="flex-1"
          >
            {currentCard === cards.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>

        {/* Card Navigation */}
        <div className="flex gap-2 justify-center flex-wrap">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentCard(index);
                setIsFlipped(false);
              }}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                index === currentCard
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={onRetry} variant="outline" className="flex-1">
            Generate New Cards
          </Button>
          <Button onClick={handleSaveToNotes} className="flex-1">
            Save to Notes
          </Button>
        </div>

        {/* Save Status */}
        {saveStatus && (
          <div className={`text-center text-sm ${
            saveStatus.includes("success") ? "text-green-600" : "text-red-600"
          }`}>
            {saveStatus}
          </div>
        )}
      </div>
    </Card>
  );
}

function FlashcardsPageContent() {
  const [inputText, setInputText] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cardCount, setCardCount] = useState(10);

  const handleGenerateFlashcards = async () => {
    if (!inputText.trim()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: inputText,
          count: cardCount
        }),
      });
      const data = await response.json();
      
      if (data.cards && data.cards.length > 0) {
        setCards(data.cards);
      } else {
        setCards([{
          front: "Could not generate flashcards",
          back: "Please try again with different text."
        }]);
      }
    } catch (error) {
      console.error('Flashcard generation error:', error);
      setCards([{
        front: "Error generating flashcards",
        back: "Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryFlashcards = () => {
    setCards([]);
    handleGenerateFlashcards();
  };

  const getTextStats = () => {
    const words = inputText.trim().split(/\s+/).filter(word => word.length > 0).length;
    const chars = inputText.length;
    return { words, chars };
  };

  const textStats = getTextStats();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader 
        title="Generate Flashcards" 
        description="Create interactive flashcards from your study materials for effective memorization"
      />

      {cards.length === 0 ? (
        <div className="grid lg:grid-cols-2 gap-8">
          <Card title="Source Content">
            <div className="space-y-4">
              {/* Text Input */}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your notes, lecture content, or study material here..."
                  className="w-full h-64 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {textStats.words} words • {textStats.chars} chars
                </div>
              </div>

              {/* Card Count Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Number of Flashcards</label>
                <div className="flex gap-2">
                  {[5, 8, 10, 15].map((count) => (
                    <Button
                      key={count}
                      onClick={() => setCardCount(count)}
                      variant={cardCount === count ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateFlashcards} 
                className="w-full" 
                disabled={!inputText.trim() || isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Flashcards...
                  </>
                ) : (
                  `Generate ${cardCount} Flashcards`
                )}
              </Button>

              {/* Text Statistics */}
              {inputText && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{textStats.words}</div>
                    <div className="text-xs text-gray-600">Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{textStats.chars}</div>
                    <div className="text-xs text-gray-600">Characters</div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Flashcard Settings Preview">
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Flashcard Configuration</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Cards:</span>
                    <span className="font-medium">{cardCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium">Question & Answer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Interaction:</span>
                    <span className="font-medium">Flip to Reveal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Study Method:</span>
                    <span className="font-medium">Active Recall</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-center">Your flashcards will appear here after generation.</p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <FlashcardInterface
          cards={cards}
          onRetry={handleRetryFlashcards}
          onSaveToNotes={() => {}}
        />
      )}
    </div>
  );
}

export default function FlashcardsPage() {
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
      <FlashcardsPageContent />
    </Suspense>
  );
}