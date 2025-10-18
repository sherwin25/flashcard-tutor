// src/types.ts
export type Card = { id: string; front: string; back: string };

export type SavedDeck = {
  id: string;
  name: string;
  topic: string;
  createdAt: number; // epoch ms
  cards: Card[];
};
