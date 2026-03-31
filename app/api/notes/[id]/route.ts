import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import type { APIErrorResponse, Note } from '@/types/api';

const MAX_CONTENT_LENGTH = 100000;
const MAX_TITLE_LENGTH = 200;
const VALID_NOTE_TYPES = ['summary', 'quiz', 'flashcard', 'note', 'ocr'];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;  // ← KEY: await params as Promise
  
  try {
    const userId = requireAuth(req);
    const note = await prisma.note.findFirst({ where: { id, userId } });
    if (!note) {
      return NextResponse.json({ error: "Note not found", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;  // ← KEY: await params as Promise
  
  try {
    const userId = requireAuth(req);
    const payload = await req.json();
    const { title, content, type } = payload;
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { title, content, type }
    });
    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;  // ← KEY: await params as Promise
  
  try {
    const userId = requireAuth(req);
    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
