"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "../components/Card";
import { Button } from "../components/ui/button";
import PageHeader from "../components/PageHeader";

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

interface QuizInterfaceProps {
  questions: QuizQuestion[];
  onRetry: () => void;
  difficulty: string;
}

function QuizInterface({ questions, onRetry, difficulty }: QuizInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResults) return;
    
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowAnswer(false);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowAnswer(false);
    }
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((score, answer, index) => {
      return score + (answer === questions[index].answer ? 1 : 0);
    }, 0);
  };

  const getScoreMessage = (score: number) => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 90) return "Excellent! 🎉";
    if (percentage >= 70) return "Great job! 👏";
    if (percentage >= 50) return "Good effort! 💪";
    return "Keep practicing! 📚";
  };

  const getScoreColor = (score: number) => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <Card title="Quiz Results">
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className={`text-6xl font-bold ${getScoreColor(score)} mb-4`}>
              {score}/{questions.length}
            </div>
            <div className="text-2xl text-gray-700 mb-2">{getScoreMessage(score)}</div>
            <div className="text-lg text-gray-600">{percentage}% Score</div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Answer Review:</h3>
            {questions.map((q, index) => {
              const isCorrect = selectedAnswers[index] === q.answer;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-sm">Question {index + 1}</span>
                    <span className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  <p className="text-gray-800 mb-2">{q.question}</p>
                  <div className="text-sm">
                    <div className="font-medium">Your answer: {q.options[selectedAnswers[index] || 'Not answered']}</div>
                    {!isCorrect && (
                      <div className="text-green-700 font-medium mt-1">
                        Correct answer: {q.options[q.answer]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button onClick={onRetry} className="flex-1">
              Retry Quiz
            </Button>
            <Button
              onClick={() => {
                setCurrentQuestion(0);
                setSelectedAnswers(new Array(questions.length).fill(null));
                setShowResults(false);
                setShowAnswer(false);
              }}
              variant="outline"
              className="flex-1"
            >
              Review Questions
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const question = questions[currentQuestion];
  const hasAnswered = selectedAnswers[currentQuestion] !== null;

  return (
    <Card title={`Question ${currentQuestion + 1} of ${questions.length}`}>
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="text-lg font-medium text-gray-900 leading-relaxed">
          {question.question}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion] === index;
            const isCorrect = index === question.answer;
            const showCorrect = showAnswer || showResults;
            
            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showAnswer}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                  showCorrect
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : isSelected
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
                    : isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${!showAnswer && 'hover:scale-[1.02]'}`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    showCorrect
                      ? isCorrect
                        ? 'border-green-500 bg-green-500'
                        : isSelected
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-300'
                      : isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {showCorrect ? (
                      isCorrect ? (
                        <span className="text-white text-xs">✓</span>
                      ) : isSelected ? (
                        <span className="text-white text-xs">✗</span>
                      ) : null
                    ) : isSelected ? (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    ) : null}
                  </div>
                  <span className={`${showCorrect && isCorrect ? 'font-semibold text-green-700' : ''}`}>
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showAnswer && question.explanation && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-1">Explanation:</h4>
            <p className="text-blue-800 text-sm">{question.explanation}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentQuestion === 0}
            className="flex-1"
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAnswer(!showAnswer)}
              variant="secondary"
              disabled={!hasAnswered}
            >
              {showAnswer ? 'Hide' : 'Show'} Answer
            </Button>
          </div>

          <Button
            onClick={handleNext}
            disabled={!hasAnswered}
            className="flex-1"
          >
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>

        {/* Quick Navigation */}
        <div className="flex gap-2 justify-center flex-wrap">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentQuestion(index);
                setShowAnswer(false);
              }}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                index === currentQuestion
                  ? 'bg-blue-600 text-white'
                  : selectedAnswers[index] !== null
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function QuizPageContent() {
  const [inputText, setInputText] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle text from summarize page
  useEffect(() => {
    const textFromSummary = searchParams.get('text');
    if (textFromSummary) {
      setInputText(decodeURIComponent(textFromSummary));
    }
  }, [searchParams]);

  const handleGenerateQuiz = async () => {
    if (!inputText.trim()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: inputText,
          difficulty,
          count: questionCount
        }),
      });
      const data = await response.json();
      
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setQuestions([{
          question: "Could not generate quiz questions. Please try with different text.",
          options: ["Try again", "Use different text", "Check input", "All of the above"],
          answer: 3,
          explanation: "The quiz generator needs more or different content to create meaningful questions."
        }]);
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      setQuestions([{
        question: "Error generating quiz. Please try again.",
        options: ["Retry", "Refresh page", "Check connection", "Try later"],
        answer: 0,
        explanation: "There was a problem connecting to the quiz generation service."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryQuiz = () => {
    setQuestions([]);
    handleGenerateQuiz();
  };

  const getTextStats = () => {
    const words = inputText.trim().split(/\s+/).filter(word => word.length > 0).length;
    const sentences = inputText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    return { words, sentences };
  };

  const textStats = getTextStats();

  const getDifficultyDescription = (diff: string) => {
    switch (diff) {
      case 'easy':
        return "Basic recall questions";
      case 'medium':
        return "Mixed recall and application";
      case 'hard':
        return "Critical thinking and analysis";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader 
        title="Generate Quiz" 
        description="Create interactive quizzes from your notes and study materials"
      />

      {questions.length === 0 ? (
        <div className="grid lg:grid-cols-2 gap-8">
          <Card title="Source Content">
            <div className="space-y-4">
              {/* Text Input */}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your notes, lecture content, or study material here..."
                  className="w-full h-64 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {textStats.words} words • {textStats.sentences} sentences
                </div>
              </div>

              {/* Difficulty Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <Button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      variant={difficulty === diff ? "default" : "outline"}
                      size="sm"
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{getDifficultyDescription(difficulty)}</p>
              </div>

              {/* Question Count Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Number of Questions</label>
                <div className="flex gap-2">
                  {[3, 5, 8, 10].map((count) => (
                    <Button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      variant={questionCount === count ? "default" : "outline"}
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
                onClick={handleGenerateQuiz} 
                className="w-full" 
                disabled={!inputText.trim() || isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Quiz...
                  </>
                ) : (
                  `Generate ${questionCount} Questions`
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
                    <div className="text-lg font-semibold text-gray-900">{textStats.sentences}</div>
                    <div className="text-xs text-gray-600">Sentences</div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Quiz Settings Preview">
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Configuration</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium capitalize">{difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Questions:</span>
                    <span className="font-medium">{questionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium">Multiple Choice</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Estimate:</span>
                    <span className="font-medium">{Math.ceil(questionCount * 1.5)} minutes</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <svg className="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-center">Your quiz will appear here after generation.</p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <QuizInterface
          questions={questions}
          onRetry={handleRetryQuiz}
          difficulty={difficulty}
        />
      )}
    </div>
  );
}

export default function QuizPage() {
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
      <QuizPageContent />
    </Suspense>
  );
}