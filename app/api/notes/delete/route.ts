import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Note ID required" },
        { status: 400 }
      );
    }

    const deleted = await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deleted }, { status: 200 });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}