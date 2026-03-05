import Card from "./components/Card";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Welcome to StudyFlow
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Transform your learning experience with AI-powered tools that convert notes, images, and audio into intelligent summaries and interactive quizzes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center justify-center rounded-xl px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Get Started
          </Link>
          <Link 
            href="/ocr" 
            className="inline-flex items-center justify-center rounded-xl px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold hover:border-indigo-500 hover:text-indigo-600 transform hover:scale-105 transition-all duration-200"
          >
            Try OCR Demo
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/ocr">
          <Card title="Image to Text">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600">Extract text from photos and handwritten notes with advanced OCR technology.</p>
            </div>
          </Card>
        </Link>

        <Link href="/speech">
          <Card title="Speech to Text">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-gray-600">Convert voice recordings and lectures into searchable text notes instantly.</p>
            </div>
          </Card>
        </Link>

        <Link href="/summarize">
          <Card title="AI Summaries">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600">AI-powered summaries that distill complex content into key insights.</p>
            </div>
          </Card>
        </Link>

        <Link href="/quiz">
          <Card title="Smart Quizzes">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600">Auto-generated practice questions that adapt to your learning style.</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
