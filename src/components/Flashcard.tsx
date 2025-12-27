"use client";

type FlashcardProps = {
  front: string;
  back: string;
  flipped: boolean;
  onToggle: () => void;
  className?: string;
};

export default function Flashcard({
  front,
  back,
  flipped,
  onToggle,
  className,
}: FlashcardProps) {
  const baseButtonClasses =
    "group relative block h-72 w-full cursor-pointer rounded-3xl border border-sky-200/60 bg-transparent p-[1px] text-left transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/70 perspective";
  const frameClasses =
    "relative h-full w-full rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-white via-sky-50 to-rose-50 text-slate-800 shadow-inner transition-transform duration-500 ease-out preserve-3d";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`${baseButtonClasses} ${className ?? ""}`}
    >
      <div
        className={`${frameClasses} ${flipped ? "rotate-y-180" : ""}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[calc(1.5rem-1px)] px-6 text-center text-lg font-medium leading-relaxed text-slate-700 backface-hidden">
          <span className="rounded-full bg-white/70 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-sky-500">
            Question
          </span>
          <p className="max-h-40 overflow-y-auto pr-2">
            {front}
          </p>
          <span className="text-xs text-slate-400 transition-opacity duration-300">
            Tap to reveal answer
          </span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-sky-400/90 via-sky-500/90 to-indigo-500/90 px-6 text-center text-lg font-medium leading-relaxed text-white backface-hidden rotate-y-180">
          <span className="rounded-full bg-white/20 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em]">
            Answer
          </span>
          <p className="max-h-40 overflow-y-auto pr-2">
            {back}
          </p>
          <span className="text-xs text-white/70 transition-opacity duration-300 group-hover:opacity-90">
            Tap to flip back
          </span>
        </div>
      </div>
    </button>
  );
}
