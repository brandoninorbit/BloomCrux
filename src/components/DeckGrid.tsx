
"use client";

import Link from "next/link";
import type { Deck as StitchDeck } from '@/stitch/types';

export function DeckGrid({ decks }: { decks: StitchDeck[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {decks.map((d) => (
        <Link
          key={d.id}
          href={`/decks/${d.id}/study`}
          className="group perspective-1000 block"
          prefetch={false}
        >
          <div className="relative w-full aspect-[3/4] bg-white rounded-xl shadow-md transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-2 transform-style-3d group-hover:rotate-y-3">
            <div className="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-lg font-medium text-center px-2 text-[#637488]">{d.description || "Deck"}</p>
            </div>
            <div className="absolute bottom-4 left-4 text-sm font-medium">{d.title}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
