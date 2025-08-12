"use client";

import Link from "next/link";
import type { Deck as StitchDeck, DeckSummary } from "@/stitch/types";
import { Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "./ui/button";

type BloomLevel = "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";
type DeckProgress = { percent: number; bloomLevel: BloomLevel } | undefined;

export function DeckCardGrid({ decks }: { decks: (StitchDeck | DeckSummary & { progress?: DeckProgress })[] }) {
  const levelTint: Record<BloomLevel, string> = {
    Remember: "bg-blue-50 text-blue-700",
    Understand: "bg-cyan-50 text-cyan-700",
    Apply: "bg-emerald-50 text-emerald-700",
    Analyze: "bg-amber-50 text-amber-700",
    Evaluate: "bg-violet-50 text-violet-700",
    Create: "bg-pink-50 text-pink-700",
  };

  const handleDelete = (deckId: string) => {
    alert(`Delete action for deck ${deckId}`);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {decks.map((d) => {
        const title = "title" in d ? d.title : (d as any).name;
        const progress = (d as any).progress as DeckProgress;
        const pct = Math.max(0, Math.min(100, progress?.percent ?? 0));

        return (
          <div key={(d as any).id} className="group perspective-1000 block">
            <div className="relative w-full aspect-[3/4] bg-white rounded-xl shadow-md transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-2 flex flex-col justify-between">
              <div className="flex-grow flex flex-col justify-center items-center p-4 text-center">
                <p className="text-lg font-semibold text-center text-gray-700">{title}</p>

                {/* STATUS ROW — compact, under title; keep height stable */}
                <div className="mt-3 w-full max-w-[80%] space-y-2">
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
                    <span className="w-10 text-right text-xs text-slate-500">{pct}%</span>
                  </div>
                </div>
              </div>

              <div className="p-2 border-t border-gray-100 space-y-2">
                <Button asChild className="w-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/decks/${(d as any).id}/study`}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Study
                  </Link>
                </Button>
                <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/decks/${(d as any).id}/edit`} passHref>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                    onClick={() => handleDelete((d as any).id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}