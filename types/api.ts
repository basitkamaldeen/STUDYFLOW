/**
 * Strict TypeScript interfaces for StudyFlow API responses
 * Enforces structured JSON responses across all AI-powered features
 */

// OCR API Response
export interface OCRResponse {
  text: string;
  success: boolean;
  metadata?: {
    fileName: string;
    fileSize: number;
    fileType: string;
    textLength: number;
  };
}

// Summary API Response
export interface SummaryResponse {
  summary: string;
  metadata?: {
    requestedLength: string;
    source: string;
  };
}

// Quiz API Types
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
  metadata?: {
    difficulty: string;
    requestedCount: number;
    actualCount: number;
    source: string;
  };
}

// Flashcard API Types
export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardsResponse {
  cards: Flashcard[];
  metadata?: {
    requestedCount: number;
    actualCount: number;
    source: string;
  };
}

// Notes API Types
export interface Note {
  id: string;
  userId: string;
  type: string;
  content: string;
  originalText?: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotesListResponse {
  notes: Note[];
}

export interface NoteCreateResponse {
  note: Note;
  success: boolean;
}

// Error Response
export interface APIErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

// Request Payload Types
export interface SummaryRequest {
  text: string;
  length?: 'short' | 'medium' | 'detailed';
}

export interface QuizRequest {
  text: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  saveToNotes?: boolean;
}

export interface FlashcardsRequest {
  text: string;
  count?: number;
  saveToNotes?: boolean; 
}

export interface NoteCreateRequest {
  content: string;
  type: string;
  originalText?: string;
  title?: string;
}
