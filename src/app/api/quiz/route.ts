// src/app/api/quiz/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { explainCard, gradeAnswer } from "@/server/agents";

export async function POST(req: NextRequest) {
  try {
    const { mode, front, correct, userAnswer } = await req.json();

    if (mode === "explain") {
      if (!front)
        return NextResponse.json(
          { error: "Missing 'front'." },
          { status: 400 }
        );
      const { explanation } = await explainCard(String(front));
      return NextResponse.json({ explanation });
    }

    if (mode === "grade") {
      if (!front || !correct || typeof userAnswer !== "string") {
        return NextResponse.json(
          { error: "Missing 'front', 'correct' or 'userAnswer'." },
          { status: 400 }
        );
      }
      const result = await gradeAnswer(
        String(front),
        String(correct),
        String(userAnswer)
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
  } catch (e) {
    console.error("/api/quiz error", e);
    return NextResponse.json(
      { error: "Failed to handle quiz action" },
      { status: 500 }
    );
  }
}
