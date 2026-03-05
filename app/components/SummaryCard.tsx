"use client";
import React from "react";

interface SummaryCardProps {
  summary: string;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <div className="bg-gray-50 p-3 rounded my-2">
      <h3 className="font-medium">Summary</h3>
      <pre className="text-sm">{summary}</pre>
    </div>
  );
}
