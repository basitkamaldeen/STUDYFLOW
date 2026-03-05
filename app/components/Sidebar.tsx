"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { name: "Home", href: "/", icon: "🏠" },
  { name: "OCR", href: "/ocr", icon: "📷" },
  { name: "Notes", href: "/notes", icon: "🗒️" },
  { name: "Flashcards", href: "/flashcards", icon: "🃏" },
  { name: "Speech", href: "/speech", icon: "🎤" },
  { name: "Summarize", href: "/summarize", icon: "📝" },
  { name: "Quiz", href: "/quiz", icon: "🧠" },
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 px-6 py-8 shadow-sm">
      <div className="mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          StudyFlow
        </h1>
        <p className="text-sm text-gray-500 mt-2">AI-Powered Learning</p>
      </div>
      
      <nav className="space-y-2">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-8 left-6 right-6">
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4 border border-indigo-200">
          <h3 className="font-semibold text-sm text-indigo-900 mb-1">Pro Tip</h3>
          <p className="text-xs text-indigo-700">
            Upload multiple files at once to process them in batch mode!
          </p>
        </div>
      </div>
    </aside>
  );
}
