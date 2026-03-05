"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      {description && <p className="text-gray-600">{description}</p>}
      {children}
    </div>
  );
}