"use client";

import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className = "",
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transform hover:scale-105 active:scale-95";

  const sizes = {
    sm: "rounded-lg px-3 py-1.5 text-xs",
    md: "rounded-xl px-4 py-2 text-sm",
    lg: "rounded-xl px-6 py-3 text-base",
  };

  const variants: Record<string, string> = {
    default: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500 shadow-lg hover:shadow-xl",
    outline: "border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500 bg-white",
    secondary: "bg-gray-100 hover:bg-gray-200 focus:ring-gray-500",
    destructive: "bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-500 shadow-lg hover:shadow-xl",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
  };

  return (
    <button 
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} 
      {...props} 
    />
  );
}
