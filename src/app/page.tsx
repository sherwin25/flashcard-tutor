"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Card, SavedDeck } from "@/types";
import {
  loadSavedDecks,
  saveDeck,
  deleteDeck,
  getDeckById,
  exportDeckJSON,
  importDeckJSON,
} from "@/lib/storage";
import { clampCardCount, MAX_CARDS, MIN_CARDS } from "@/lib/constants";
import Flashcard from "@/components/Flashcard";

export default function Home() {
  // Generate deck
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "beginner"
  );
  const [nCardsInput, setNCardsInput] = useState("10");
  const [deck, setDeck] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const current = deck[idx];

  // Saving
  const [saveName, setSaveName] = useState("");
  const [saved, setSaved] = useState<SavedDeck[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSaved(loadSavedDecks());
  }, []);

  useEffect(() => {
    setIsFlipped(false);
  }, [idx, deck]);

  const canSave = useMemo(() => deck.length > 0, [deck]);
  const progress =
    deck.length > 0 ? Math.round(((idx + 1) / deck.length) * 100) : 0;

  async function createDeck() {
    setLoading(true);
    setDeck([]);
    setIdx(0);
    setIsFlipped(false);
    try {
      const rawCount = Number.parseInt(nCardsInput, 10);
      const desiredCount = clampCardCount(
        Number.isNaN(rawCount) ? 10 : rawCount
      );
      setNCardsInput(String(desiredCount));

      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, level, nCards: desiredCount }),
      });
      const data = await res.json();
      const d = (data.deck ?? []) as Card[];
      setDeck(d);
      setSaveName(topic ? `${topic} (${level})` : "New deck");
    } finally {
      setLoading(false);
    }
  }

  function nextCard() {
    setIsFlipped(false);
    setIdx((i) => (i + 1 < deck.length ? i + 1 : i));
  }

  function saveCurrentDeck() {
    if (!canSave) return;
    const deckObj = saveDeck(saveName || topic || "Untitled Deck", topic, deck);
    setSaved(loadSavedDecks());
    alert(`Saved: "${deckObj.name}"`);
  }

  function loadDeck(id: string) {
    const d = getDeckById(id);
    if (!d) return;
    setDeck(d.cards);
    setIdx(0);
    setIsFlipped(false);
    setTopic(d.topic);
    setSaveName(d.name);
  }

  function removeDeck(id: string) {
    deleteDeck(id);
    setSaved(loadSavedDecks());
  }

  function downloadDeckJSON(id: string) {
    const d = getDeckById(id);
    if (!d) return;
    const text = exportDeckJSON(d);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = d.name.replace(/[^\w\-]+/g, "_").slice(0, 40);
    a.href = url;
    a.download = `${safeName || "deck"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const deck = importDeckJSON(String(reader.result || ""));
        setSaved(loadSavedDecks());
        alert(`Imported: "${deck.name}"`);
      } catch (err: any) {
        alert(err?.message || "Failed to import.");
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dff4ff,_#fef4ff)]">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-10">
        <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-xl transition-shadow hover:shadow-2xl">
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_1fr]">
            {/* Create / Current Deck */}
            <div className="space-y-6">
              <header className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
                  AI powered
                </span>
                <h1 className="text-3xl font-semibold text-slate-800 sm:text-4xl">
                  Flashcard Tutor Agent
                </h1>
                <p className="max-w-xl text-sm text-slate-500 sm:text-base">
                  Generate tailored flashcards for any topic, flip through them
                  with delightful motion, and build a personal study library you
                  can export or share.
                </p>
              </header>

              <div className="rounded-3xl border border-sky-100 bg-white/80 p-6 shadow-inner">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Topic
                    </label>
                    <input
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder="e.g. SQL joins, Pokémon types, NBA rules"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Level
                    </label>
                    <select
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      value={level}
                      onChange={(e) => setLevel(e.target.value as any)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[3fr_2fr]">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Cards ({MIN_CARDS}-{MAX_CARDS})
                    </label>
                    <input
                      type="number"
                      min={MIN_CARDS}
                      max={MAX_CARDS}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      value={nCardsInput}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        if (digitsOnly === "") {
                          setNCardsInput("");
                          return;
                        }
                        const numeric = Number.parseInt(digitsOnly, 10);
                        if (Number.isNaN(numeric)) {
                          setNCardsInput("");
                          return;
                        }
                        const capped = Math.min(MAX_CARDS, numeric);
                        setNCardsInput(String(capped));
                      }}
                      onBlur={() =>
                        setNCardsInput((prev) => {
                          const parsed = Number.parseInt(prev, 10);
                          const normalized = clampCardCount(
                            Number.isNaN(parsed) ? 10 : parsed
                          );
                          return String(normalized);
                        })
                      }
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-300/40 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={createDeck}
                      disabled={loading || !topic.trim()}
                    >
                      {loading ? "Generating..." : "Create Study Deck"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-sky-100/40">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                          Current Deck
                        </span>
                        <span className="text-xl font-semibold text-slate-700">
                          {saveName || topic || "Untitled Deck"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        className="w-52 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="Rename deck before saving"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                      />
                      <button
                        className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-100 disabled:opacity-40"
                        onClick={saveCurrentDeck}
                        disabled={!canSave}
                        title={canSave ? "Save this deck locally" : "No deck yet"}
                      >
                        Save Deck
                      </button>
                    </div>
                  </div>

                  {!current ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-400">
                      Generate a deck to start studying.
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                          <span>
                            Card {idx + 1} / {deck.length}
                          </span>
                          <span>{progress}% complete</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Flashcard
                          front={current.front}
                          back={current.back}
                          flipped={isFlipped}
                          onToggle={() => setIsFlipped((s) => !s)}
                        />
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-2">
                        <button
                          className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-100"
                          onClick={() => setIsFlipped((s) => !s)}
                        >
                          {isFlipped ? "Hide answer" : "Reveal answer"}
                        </button>
                        <button
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:opacity-30"
                          onClick={() => setIdx((i) => (i > 0 ? i - 1 : i))}
                          disabled={idx === 0}
                        >
                          Previous
                        </button>
                        <button
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:opacity-30"
                          onClick={nextCard}
                          disabled={idx + 1 >= deck.length}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Saved Decks */}
            <aside className="space-y-5">
              <div className="rounded-3xl border border-indigo-100 bg-white/90 p-6 shadow-lg shadow-indigo-100/40">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Saved Study Library
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
                      onClick={handleImportClick}
                    >
                      Import Deck
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={handleImportFile}
                    />
                  </div>
                </div>

                {saved.length === 0 ? (
                  <p className="mt-6 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 px-5 py-8 text-center text-sm text-indigo-400">
                    Save decks here to build your study archive.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {saved.map((d) => (
                      <li
                        key={d.id}
                        className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-3">
                          <div>
                            <div className="text-base font-semibold text-slate-700">
                              {d.name}
                            </div>
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              {new Date(d.createdAt).toLocaleString()} • {d.cards.length} cards
                              {d.topic ? ` • ${d.topic}` : ""}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300"
                              onClick={() => loadDeck(d.id)}
                            >
                              Load
                            </button>
                            <button
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300"
                              onClick={() => downloadDeckJSON(d.id)}
                              title="Download as JSON"
                            >
                              Export
                            </button>
                            <button
                              className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-500 transition hover:bg-red-100"
                              onClick={() => removeDeck(d.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-inner">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Tips
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-500">
                  <li>
                    Use the flip action or keyboard shortcuts to quiz yourself
                    quickly.
                  </li>
                  <li>
                    Export decks as JSON to collaborate with friends or import on
                    another device.
                  </li>
                  <li>
                    Adjust the level slider to tune how challenging the cards will
                    be.
                  </li>
                </ul>
              </div>
            </aside>
          </div>

          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-10 -left-20 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="absolute -bottom-16 -right-10 h-72 w-72 rounded-full bg-rose-200/50 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white via-transparent to-white/60" />
          </div>
        </section>
      </div>
    </main>
  );
}
