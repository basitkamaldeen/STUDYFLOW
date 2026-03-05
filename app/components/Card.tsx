"use client";

import React from "react";

export default function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 w-full transition-all duration-300 hover:shadow-2xl hover:border-gray-300/50 hover:scale-[1.02] ${className}`}>
      <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full mr-3"></div>
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
