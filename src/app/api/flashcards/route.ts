// src/app/api/flashcards/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { generateDeck } from "@/server/agents";
import { clampCardCount } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { topic, level = "beginner", nCards = 10 } = await req.json();

    if (!topic || String(topic).trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide a topic." },
        { status: 400 }
      );
    }

    const requested = Number(nCards);
    const safeCount = clampCardCount(
      Number.isFinite(requested) ? requested : 10
    );

    const { deck } = await generateDeck(
      String(topic),
      String(level),
      safeCount
    );
    return NextResponse.json({ deck });
  } catch (e) {
    console.error("/api/flashcards error", e);
    return NextResponse.json(
      { error: "Failed to generate deck" },
      { status: 500 }
    );
  }
}
