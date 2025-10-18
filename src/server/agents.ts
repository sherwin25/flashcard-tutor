// src/server/agents.ts
import OpenAI from "openai";
import { clampCardCount } from "@/lib/constants";

/**
 * Minimal agent-like helpers on top of Chat Completions.
 * Keeps types simple and works well on Vercel + Next 15.
 */

export type Card = { id: string; front: string; back: string };
export type Deck = Card[];

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export async function generateDeck(
  topic: string,
  level = "beginner",
  nCards = 10
) {
  const totalCards = clampCardCount(
    Number.isFinite(nCards) ? nCards : 10
  );
  const sys = `You are a careful flashcard creator.
- Produce ${totalCards} concise Q/A cards for the topic.
- Level: ${level}.
- Prefer atomic facts or short how-tos.
- Avoid hallucinations; if unsure, keep generic or skip.
- Return JSON with "cards":[{"front":"...","back":"..."}] (no extra commentary).`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `Topic: ${topic}` },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { cards?: { front: string; back: string }[] } = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const cardsArr = (parsed.cards ?? []).slice(0, totalCards).map((c) => ({
    id: uid(),
    front: String(c.front || "").slice(0, 240),
    back: String(c.back || "").slice(0, 480),
  }));

  return { deck: cardsArr };
}

export async function explainCard(front: string) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a friendly tutor. Explain briefly in 2-4 sentences, avoid jargon, add a tiny example if helpful.",
      },
      { role: "user", content: `Explain: ${front}` },
    ],
  });

  return { explanation: completion.choices[0]?.message?.content?.trim() ?? "" };
}

export async function gradeAnswer(
  front: string,
  correct: string,
  userAnswer: string
) {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You are a fair grader. Compare user answer to the correct answer. Return JSON: {"score":0..1,"verdict":"correct|partial|incorrect","tips":"..."}',
      },
      {
        role: "user",
        content: `Q: ${front}\nCorrect: ${correct}\nUser: ${userAnswer}`,
      },
    ],
  });

  try {
    return JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch {
    return {
      score: 0,
      verdict: "incorrect",
      tips: "Try focusing on the key idea.",
    };
  }
}
