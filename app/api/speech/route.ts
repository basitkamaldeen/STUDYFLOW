import { NextRequest, NextResponse } from "next/server";
import { callHFSpace } from "../../../lib/hf-client";
import { prisma } from "../../../lib/prisma";

export async function POST(req: NextRequest) {
  const { userId, audioBase64 } = await req.json();
  if (!audioBase64) return NextResponse.json({ error: "No audio uploaded" }, { status: 400 });

  const text = await callHFSpace("speech", audioBase64);

  const note = await prisma.note.create({
    data: { userId, type: "speech", content: text },
  });

  return NextResponse.json({ text, note });
}
