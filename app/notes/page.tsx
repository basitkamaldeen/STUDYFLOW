"use client";

import { useState, useEffect, Suspense } from "react";
import Card from "../components/Card";
import { Button } from "../components/ui/button";
import PageHeader from "../components/PageHeader";

interface Note {
  id: string;
  type: 'ocr' | 'summary' | 'quiz' | 'flashcard';
  title: string;
  content: string;
  originalText?: string;
  createdAt: string;
}

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

function NoteCard({ note, onDelete }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ocr':
        return '📷';
      case 'summary':
        return '📝';
      case 'quiz':
        return '🎯';
      case 'flashcard':
        return '🃏';
      default:
        return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ocr':
        return 'from-blue-500 to-cyan-500';
      case 'summary':
        return 'from-green-500 to-emerald-500';
      case 'quiz':
        return 'from-orange-500 to-red-500';
      case 'flashcard':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayContent = isExpanded ? note.content : 
    note.content.length > 200 ? note.content.substring(0, 200) + '...' : note.content;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getTypeColor(note.type)} p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTypeIcon(note.type)}</span>
            <div>
              <h3 className="text-white font-semibold">{note.title}</h3>
              <p className="text-white/80 text-sm">{formatDate(note.createdAt)}</p>
            </div>
          </div>
          <Button
            onClick={() => onDelete(note.id)}
            variant="outline"
            size="sm"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white">
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </div>
        
        {note.content.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
          
          {note.type === 'summary' && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                window.location.href = `/quiz?text=${encodeURIComponent(note.content)}`;
              }}
            >
              Generate Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function NotesPageContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [deleteStatus, setDeleteStatus] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      const data = await response.json();
      
      if (data.notes) {
        setNotes(data.notes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== id));
        setDeleteStatus('Note deleted successfully');
        setTimeout(() => setDeleteStatus(''), 3000);
      } else {
        setDeleteStatus('Failed to delete note');
        setTimeout(() => setDeleteStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      setDeleteStatus('Error deleting note');
      setTimeout(() => setDeleteStatus(''), 3000);
    }
  };

  const filteredNotes = filter === 'all' 
    ? notes 
    : notes.filter(note => note.type === filter);

  const getStats = () => {
    const stats = {
      total: notes.length,
      ocr: notes.filter(n => n.type === 'ocr').length,
      summary: notes.filter(n => n.type === 'summary').length,
      quiz: notes.filter(n => n.type === 'quiz').length,
      flashcard: notes.filter(n => n.type === 'flashcard').length
    };
    return stats;
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader 
        title="My Notes" 
        description="Access all your saved study materials in one place"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card title="Total">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </Card>
        <Card title="OCR">
          <div className="text-2xl font-bold text-blue-600">{stats.ocr}</div>
        </Card>
        <Card title="Summaries">
          <div className="text-2xl font-bold text-green-600">{stats.summary}</div>
        </Card>
        <Card title="Quizzes">
          <div className="text-2xl font-bold text-orange-600">{stats.quiz}</div>
        </Card>
        <Card title="Flashcards">
          <div className="text-2xl font-bold text-purple-600">{stats.flashcard}</div>
        </Card>
      </div>

      {/* Filter */}
      {notes.length > 0 && (
        <Card title="Filter by Type">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              All ({stats.total})
            </Button>
            <Button
              onClick={() => setFilter('ocr')}
              variant={filter === 'ocr' ? 'default' : 'outline'}
              size="sm"
            >
              📷 OCR ({stats.ocr})
            </Button>
            <Button
              onClick={() => setFilter('summary')}
              variant={filter === 'summary' ? 'default' : 'outline'}
              size="sm"
            >
              📝 Summaries ({stats.summary})
            </Button>
            <Button
              onClick={() => setFilter('quiz')}
              variant={filter === 'quiz' ? 'default' : 'outline'}
              size="sm"
            >
              🎯 Quizzes ({stats.quiz})
            </Button>
            <Button
              onClick={() => setFilter('flashcard')}
              variant={filter === 'flashcard' ? 'default' : 'outline'}
              size="sm"
            >
              🃏 Flashcards ({stats.flashcard})
            </Button>
          </div>
        </Card>
      )}

      {/* Notes List */}
      {filteredNotes.length > 0 ? (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      ) : (
        <Card title="No Notes Found">
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mb-4 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-lg mb-2">
              {filter === 'all' ? "No notes saved yet" : `No ${filter} notes found`}
            </p>
            <p className="text-sm">
              {filter === 'all' 
                ? "Start creating notes using the OCR, Summary, Quiz, or Flashcards tools!"
                : "Try a different filter or create notes of this type."
              }
            </p>
            <div className="mt-6 flex gap-3 justify-center">
              <Button onClick={() => window.location.href = '/ocr'}>
                📷 Try OCR
              </Button>
              <Button onClick={() => window.location.href = '/summarize'}>
                📝 Try Summary
              </Button>
              <Button onClick={() => window.location.href = '/quiz'}>
                🎯 Try Quiz
              </Button>
              <Button onClick={() => window.location.href = '/flashcards'}>
                🃏 Try Flashcards
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Status */}
      {deleteStatus && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
          deleteStatus.includes('success') ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {deleteStatus}
        </div>
      )}
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <NotesPageContent />
    </Suspense>
  );
}