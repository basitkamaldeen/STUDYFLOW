import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { content, type, title } = await req.json();

    if (!content || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create note with anonymous userId (since no auth)
    const note = await prisma.note.create({
      data: {
        userId: "anonymous",
        type,
        content,
        title: title || `${type}: ${content.substring(0, 50)}...`,
      },
    });

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}