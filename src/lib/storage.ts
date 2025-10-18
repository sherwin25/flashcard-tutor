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

type RawCard = Record<string, unknown>;
type RawDeck = {
  name?: unknown;
  topic?: unknown;
  cards?: unknown;
};

function toCard(raw: RawCard): Card {
  const id =
    typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id : uid();
  const front = typeof raw.front === "string" ? raw.front : String(raw.front ?? "");
  const back = typeof raw.back === "string" ? raw.back : String(raw.back ?? "");
  return { id, front, back };
}

export function importDeckJSON(jsonText: string): SavedDeck {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid deck format.");
  }

  const rawDeck = parsed as RawDeck;
  if (!Array.isArray(rawDeck.cards)) {
    throw new Error("Invalid deck format.");
  }

  const deck: SavedDeck = {
    id: uid(),
    name:
      typeof rawDeck.name === "string" && rawDeck.name.trim().length > 0
        ? rawDeck.name
        : "Imported Deck",
    topic: typeof rawDeck.topic === "string" ? rawDeck.topic : "",
    createdAt: Date.now(),
    cards: rawDeck.cards
      .filter(
        (card): card is RawCard =>
          card !== null && typeof card === "object" && !Array.isArray(card)
      )
      .map((card) => toCard(card)),
  };

  const decks = readAll();
  decks.push(deck);
  writeAll(decks);
  return deck;
}
