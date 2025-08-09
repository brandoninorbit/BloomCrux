
"use client";

import Link from "next/link";
import type { Deck as StitchDeck, DeckSummary, BloomLevel } from '@/stitch/types';
import { Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useRef } from 'react';
import autoAnimate from '@formkit/auto-animate';
import { motion } from "framer-motion";

type DeckProgress = {
  percent: number;
  bloomLevel: BloomLevel;
};

// A new, more detailed card component
export function DeckCard({
  deck,
}: {
  deck: (StitchDeck | DeckSummary) & { progress?: DeckProgress };
}) {
  const levelTint: Record<BloomLevel, string> = {
    Remember:   "bg-blue-50 text-blue-700",
    Understand: "bg-cyan-50 text-cyan-700",
    Apply:      "bg-emerald-50 text-emerald-700",
    Analyze:    "bg-amber-50 text-amber-700",
    Evaluate:   "bg-violet-50 text-violet-700",
    Create:     "bg-pink-50 text-pink-700",
  };

  const progress = deck.progress;
  const pct = Math.max(0, Math.min(100, progress?.percent ?? 0));
  const title = 'title' in deck ? deck.title : deck.name;

  const handleDelete = (deckId: string) => {
    // Placeholder for delete functionality
    alert(`Delete action for deck ${deckId}`);
  };

  return (
    <div className="group perspective-1000 block h-full">
      <div className="relative w-full h-full bg-white rounded-xl shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 flex flex-col justify-between">
        <div className="p-5 pb-3">
          <h3 className="text-center font-semibold text-slate-800">{title}</h3>
          
          {/* STATUS ROW — insert directly under the deck title */}
          <div className="mt-3 space-y-2">
            {progress && (
              <div className="flex justify-center">
                <span className={`px-2 py-0.5 text-xs rounded-full ${levelTint[progress.bloomLevel]}`}>
                  {progress.bloomLevel}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs text-slate-500">
                {pct}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-2 border-t border-gray-100">
          <div className="p-2 flex items-center justify-between">
            <Button asChild className="w-full mr-3">
              <Link href={`/decks/${deck.id}/study`}>
                <BookOpen className="mr-2 h-4 w-4"/>
                Study
              </Link>
            </Button>
            <div className="flex items-center">
              <Link href={`/decks/${deck.id}/edit`} passHref>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-600" onClick={() => handleDelete(deck.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// The component now accepts DeckSummary to match the client
export function DeckGrid({ decks }: { decks: ((StitchDeck | DeckSummary) & { progress?: DeckProgress })[] }) {
  const parent = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (parent.current) {
      autoAnimate(parent.current);
    }
  }, [parent]);

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 6 },
    show:   { opacity: 1, scale: 1,    y: 0 },
  };

  return (
    <>
      {decks.map((d) => (
        <motion.div
          key={d.id}
          variants={itemVariants}
          className="h-full"
        >
          <DeckCard deck={d} />
        </motion.div>
      ))}
    </>
  );
}
