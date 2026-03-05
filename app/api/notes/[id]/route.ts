import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/auth";
import type { APIErrorResponse } from "../../../../types/api";

/**
 * DELETE /api/notes/[id] - Delete a specific note
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean } | APIErrorResponse>> {
  const requestId = crypto.randomUUID();
  const { id } = params;
  
  console.log(`[Notes-DELETE-${requestId}] Deleting note ${id}`);

  try {
    // Authenticate user
    let userId: string;
    try {
      userId = getCurrentUser(req);
    } catch (authError) {
      console.warn(`[Notes-DELETE-${requestId}] Authentication failed`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Unauthorized", 
        details: "Please sign in to delete notes",
        code: "UNAUTHORIZED"
      }, { status: 401 });
    }

    // Validate note ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json<APIErrorResponse>({ 
        error: "Invalid note ID", 
        details: "Note ID is required",
        code: "INVALID_ID"
      }, { status: 400 });
    }

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingNote) {
      console.warn(`[Notes-DELETE-${requestId}] Note ${id} not found or not owned by user ${userId}`);
      return NextResponse.json<APIErrorResponse>({ 
        error: "Note not found", 
        details: "The note you're trying to delete doesn't exist or you don't have permission to delete it",
        code: "NOT_FOUND"
      }, { status: 404 });
    }

    // Delete the note
    await prisma.note.delete({
      where: { id }
    });

    console.log(`[Notes-DELETE-${requestId}] Successfully deleted note ${id}`);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error(`[Notes-DELETE-${requestId}] Unexpected error:`, error);
    return NextResponse.json<APIErrorResponse>({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Failed to delete note",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}
