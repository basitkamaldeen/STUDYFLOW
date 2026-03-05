"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { name: "Home", href: "/", icon: "🏠" },
  { name: "OCR", href: "/ocr", icon: "📷" },
  { name: "Notes", href: "/notes", icon: "🗒️" },
  { name: "Flashcards", href: "/flashcards", icon: "🃏" },
  { name: "Speech", href: "/speech", icon: "🎤" },
  { name: "Quiz", href: "/quiz", icon: "🧠" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 flex justify-around py-2 px-4 shadow-2xl z-50">
      {nav.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
              isActive
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
