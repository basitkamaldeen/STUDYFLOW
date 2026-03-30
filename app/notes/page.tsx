"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import { Button } from "../components/ui/button";
import { getWithAuth, postWithAuth, deleteWithAuth, putWithAuth } from "../../lib/fetchWithAuth";

interface Note {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState({ title: "", content: "", type: "note" });
  const [isCreating, setIsCreating] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isReadModalOpen, setIsReadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "", type: "note" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch notes on mount
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const data = await getWithAuth("/api/notes");
      setNotes(data.notes || []);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      if (error instanceof Error && error.message.includes('401')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Create new note
  const handleCreateNote = async () => {
    if (!newNote.content.trim()) {
      alert("Please enter note content");
      return;
    }

    setIsCreating(true);
    try {
      const { note } = await postWithAuth("/api/notes", {
        title: newNote.title || `Note - ${new Date().toLocaleDateString()}`,
        content: newNote.content,
        type: newNote.type,
      });

      setNotes([note, ...notes]);
      setNewNote({ title: "", content: "", type: "note" });
      alert("Note created successfully!");
    } catch (error) {
      console.error("Create note error:", error);
      alert("Failed to create note");
    } finally {
      setIsCreating(false);
    }
  };

  // Update note (edit)
  const handleUpdateNote = async () => {
    if (!editForm.content.trim()) {
      alert("Please enter note content");
      return;
    }

    try {
      const response = await putWithAuth(`/api/notes/${selectedNote?.id}`, {
        title: editForm.title || `Note - ${new Date().toLocaleDateString()}`,
        content: editForm.content,
        type: editForm.type,
      });

      const updatedNote = response.note;
      setNotes(notes.map(note => 
        note.id === updatedNote.id ? updatedNote : note
      ));
      setSelectedNote(updatedNote);
      setIsEditModalOpen(false);
      alert("Note updated successfully!");
    } catch (error) {
      console.error("Update note error:", error);
      alert("Failed to update note");
    }
  };

  // Delete note
  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteWithAuth(`/api/notes/${id}`);
      setNotes(notes.filter((n) => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setIsReadModalOpen(false);
        setIsEditModalOpen(false);
      }
      alert("Note deleted successfully!");
    } catch (error) {
      console.error("Delete note error:", error);
      alert("Failed to delete note");
    }
  };

  // Open read modal
  const openReadModal = (note: Note) => {
    setSelectedNote(note);
    setIsReadModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (note: Note) => {
    setSelectedNote(note);
    setEditForm({
      title: note.title,
      content: note.content,
      type: note.type
    });
    setIsEditModalOpen(true);
  };

  // Close modals
  const closeReadModal = () => {
    setIsReadModalOpen(false);
    setSelectedNote(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditForm({ title: "", content: "", type: "note" });
    setSelectedNote(null);
  };

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           note.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || note.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "az") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "za") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageHeader
        title="My Notes"
        description={`Welcome back, ${user.username}! Create, view, and manage your study notes.`}
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{notes.length}</div>
          <div className="text-sm text-gray-600">Total Notes</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {notes.filter(n => n.type === 'note').length}
          </div>
          <div className="text-sm text-gray-600">General Notes</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {notes.filter(n => n.type === 'summary').length}
          </div>
          <div className="text-sm text-gray-600">Summaries</div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {notes.filter(n => n.type === 'quiz' || n.type === 'flashcard').length}
          </div>
          <div className="text-sm text-gray-600">Quizzes/Flashcards</div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="note">General Notes</option>
          <option value="summary">Summaries</option>
          <option value="quiz">Quizzes</option>
          <option value="flashcard">Flashcards</option>
          <option value="ocr">OCR Text</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
        </select>
      </div>

      {/* Create New Note */}
      <Card title="Create New Note">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Note title (optional)"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <textarea
            placeholder="Write your note here..."
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            className="w-full h-40 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          <select
            value={newNote.type}
            onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="note">General Note</option>
            <option value="summary">Summary</option>
            <option value="quiz">Quiz</option>
            <option value="flashcard">Flashcard</option>
            <option value="ocr">OCR Text</option>
          </select>

          <Button
            onClick={handleCreateNote}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? "Creating..." : "Create Note"}
          </Button>
        </div>
      </Card>

      {/* Notes List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Notes ({filteredNotes.length})</h2>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || filterType !== "all" 
              ? "No notes match your search. Try different filters!" 
              : "No notes yet. Create your first note above!"}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <Card 
                key={note.id} 
                title={note.title}
                className="hover:shadow-lg transition-all"
              >
                <div className="space-y-3">
                  <div className="flex gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      note.type === 'note' ? 'bg-gray-100 text-gray-700' :
                      note.type === 'summary' ? 'bg-green-100 text-green-700' :
                      note.type === 'quiz' ? 'bg-orange-100 text-orange-700' :
                      note.type === 'flashcard' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {note.type}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-gray-700 line-clamp-3">{note.content}</p>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => openReadModal(note)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                    >
                      Read
                    </Button>
                    <Button
                      onClick={() => openEditModal(note)}
                      variant="outline"
                      className="flex-1 text-green-600 hover:text-green-700 border-green-300 hover:border-green-500"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteNote(note.id)}
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 border-red-300 hover:border-red-500"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* READ MODAL - View Note Only */}
      {isReadModalOpen && selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeReadModal}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{selectedNote.title}</h3>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedNote.type === 'note' ? 'bg-gray-100 text-gray-700' :
                      selectedNote.type === 'summary' ? 'bg-green-100 text-green-700' :
                      selectedNote.type === 'quiz' ? 'bg-orange-100 text-orange-700' :
                      selectedNote.type === 'flashcard' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedNote.type}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      Created: {new Date(selectedNote.createdAt).toLocaleString()}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      Updated: {new Date(selectedNote.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeReadModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              
              <div className="prose max-w-none mt-4">
                <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap">
                  {selectedNote.content}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  onClick={() => {
                    closeReadModal();
                    openEditModal(selectedNote);
                  }}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Edit Note
                </Button>
                <Button
                  onClick={() => {
                    handleDeleteNote(selectedNote.id);
                    closeReadModal();
                  }}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete Note
                </Button>
                <Button
                  onClick={closeReadModal}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - Edit Note */}
      {isEditModalOpen && selectedNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeEditModal}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold">Edit Note</h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Note title (optional)"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    placeholder="Note content"
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full h-64 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="note">General Note</option>
                    <option value="summary">Summary</option>
                    <option value="quiz">Quiz</option>
                    <option value="flashcard">Flashcard</option>
                    <option value="ocr">OCR Text</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    onClick={closeEditModal}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateNote}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}