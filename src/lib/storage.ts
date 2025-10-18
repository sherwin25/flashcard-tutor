import type { SavedDeck, Card } from "@/types";

const STORAGE_KEY = "ft_saved_decks_v1";

function readAll(): SavedDeck[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedDeck[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(decks: SavedDeck[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadSavedDecks(): SavedDeck[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function saveDeck(
  name: string,
  topic: string,
  cards: Card[]
): SavedDeck {
  const decks = readAll();
  const deck: SavedDeck = {
    id: uid(),
    name: name.trim() || topic || "Untitled Deck",
    topic,
    createdAt: Date.now(),
    cards,
  };
  decks.push(deck);
  writeAll(decks);
  return deck;
}

export function deleteDeck(id: string) {
  const decks = readAll().filter((d) => d.id !== id);
  writeAll(decks);
}

export function getDeckById(id: string): SavedDeck | undefined {
  return readAll().find((d) => d.id === id);
}

export function exportDeckJSON(deck: SavedDeck): string {
  return JSON.stringify(
    {
      name: deck.name,
      topic: deck.topic,
      createdAt: deck.createdAt,
      cards: deck.cards,
      schema: "flashcard-tutor.v1",
    },
    null,
    2
  );
}

export function importDeckJSON(jsonText: string): SavedDeck {
  let parsed: any = {};
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON file.");
  }
  if (!parsed || !Array.isArray(parsed.cards)) {
    throw new Error("Invalid deck format.");
  }
  const deck: SavedDeck = {
    id: uid(),
    name: String(parsed.name || "Imported Deck"),
    topic: String(parsed.topic || ""),
    createdAt: Date.now(),
    cards: parsed.cards.map((c: any) => ({
      id: c.id || uid(),
      front: String(c.front ?? ""),
      back: String(c.back ?? ""),
    })),
  };
  const decks = readAll();
  decks.push(deck);
  writeAll(decks);
  return deck;
}
