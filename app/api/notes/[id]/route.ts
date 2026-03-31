import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import type { APIErrorResponse, Note } from "@/types/api";

const MAX_CONTENT_LENGTH = 100000;
const MAX_TITLE_LENGTH = 200;
const VALID_NOTE_TYPES = ['summary', 'quiz', 'flashcard', 'note', 'ocr'];

/**
 * GET /api/notes/[id] - Get a specific note
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ note: Note } | APIErrorResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await params; // Await the params Promise
  
  console.log(`[Notes-GET-${requestId}] Fetching note ${id}`);

  try {
    const userId = requireAuth(req);

    const note = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!note) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Note not found", 
        details: "The note doesn't exist or you don't have permission",
        code: "NOT_FOUND"
      }, { status: 404 });
    }

    const formattedNote: Note = {
      id: note.id,
      userId: note.userId,
      type: note.type,
      content: note.content,
      originalText: note.originalText || undefined,
      title: note.title,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    };

    return NextResponse.json({ note: formattedNote });

  } catch (error) {
    console.error(`[Notes-GET-${requestId}] Error:`, error);
    return NextResponse.json<APIErrorResponse>({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Failed to fetch note",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

/**
 * PUT /api/notes/[id] - Update a specific note
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ note: Note } | APIErrorResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await params; // Await the params Promise
  
  console.log(`[Notes-PUT-${requestId}] Updating note ${id}`);

  try {
    const userId = requireAuth(req);

    // Parse request body
    let payload: unknown;
    try {
      payload = await req.json();
    } catch (parseError) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid request body", 
        details: "Request body must be valid JSON",
        code: "INVALID_JSON"
      }, { status: 400 });
    }

    const { title, content, type } = payload as { title?: string; content: string; type: string };

    if (!content || content.trim().length === 0) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid content", 
        details: "Note content cannot be empty",
        code: "EMPTY_CONTENT"
      }, { status: 400 });
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Content too long", 
        details: `Note content must be less than ${MAX_CONTENT_LENGTH} characters`,
        code: "CONTENT_TOO_LONG"
      }, { status: 400 });
    }

    if (!VALID_NOTE_TYPES.includes(type)) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid note type", 
        details: `Type must be one of: ${VALID_NOTE_TYPES.join(', ')}`,
        code: "INVALID_TYPE"
      }, { status: 400 });
    }

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!existingNote) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Note not found", 
        details: "The note doesn't exist or you don't have permission",
        code: "NOT_FOUND"
      }, { status: 404 });
    }

    // Generate title if not provided
    let finalTitle = title;
    if (!finalTitle || finalTitle.trim().length === 0) {
      const words = content.split(/\s+/).slice(0, 5);
      finalTitle = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${words.join(' ')}${words.length < content.split(/\s+/).length ? '...' : ''}`;
    }

    if (finalTitle.length > MAX_TITLE_LENGTH) {
      finalTitle = finalTitle.substring(0, MAX_TITLE_LENGTH - 3) + '...';
    }

    // Update note
    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: finalTitle,
        content,
        type
      }
    });

    console.log(`[Notes-PUT-${requestId}] Updated note ${id}`);

    const formattedNote: Note = {
      id: updatedNote.id,
      userId: updatedNote.userId,
      type: updatedNote.type,
      content: updatedNote.content,
      originalText: updatedNote.originalText || undefined,
      title: updatedNote.title,
      createdAt: updatedNote.createdAt,
      updatedAt: updatedNote.updatedAt
    };

    return NextResponse.json({ note: formattedNote });

  } catch (error) {
    console.error(`[Notes-PUT-${requestId}] Error:`, error);
    return NextResponse.json<APIErrorResponse>({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Failed to update note",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

/**
 * DELETE /api/notes/[id] - Delete a specific note
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean } | APIErrorResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = await params; // Await the params Promise
  
  console.log(`[Notes-DELETE-${requestId}] Deleting note ${id}`);

  try {
    const userId = requireAuth(req);

    if (!id || typeof id !== 'string') {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid note ID", 
        details: "Note ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    const existingNote = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!existingNote) {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Note not found", 
        details: "The note doesn't exist or you don't have permission",
        code: "NOT_FOUND"
      }, { status: 404 });
    }

    await prisma.note.delete({ where: { id } });

    console.log(`[Notes-DELETE-${requestId}] Deleted note ${id}`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(`[Notes-DELETE-${requestId}] Error:`, error);
    return NextResponse.json<APIErrorResponse>({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Failed to delete note",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}
