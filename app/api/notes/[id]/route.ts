import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Handler Type for Note operations
export type NoteHandlerResponse = Promise<{ id: string }>;  

// GET method to retrieve a note by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }): NoteHandlerResponse {
    const { id } = params;
    try {
        const note = await prisma.note.findUnique({ where: { id } });
        if (!note) {
            return NextResponse.json({ message: 'Note not found' }, { status: 404 });
        }
        return NextResponse.json(note);
    } catch (error) {
        return NextResponse.json({ error: 'Error retrieving note' }, { status: 500 });
    }
}

// PUT method to update a note by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }): NoteHandlerResponse {
    const { id } = params;
    const data = await req.json();
    try {
        const updatedNote = await prisma.note.update({
            where: { id },
            data,
        });
        return NextResponse.json(updatedNote);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating note' }, { status: 500 });
    }
}

// DELETE method to remove a note by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }): NoteHandlerResponse {
    const { id } = params;
    try {
        await prisma.note.delete({ where: { id } });
        return NextResponse.json({ message: 'Note deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting note' }, { status: 500 });
    }
}