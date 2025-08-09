
"use client";

import Link from "next/link";
import type { Deck as StitchDeck, DeckSummary } from '@/stitch/types';
import { Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useRef } from 'react';
import autoAnimate from '@formkit/auto-animate';

// The component now accepts DeckSummary to match the client
export function DeckGrid({ decks }: { decks: (StitchDeck | DeckSummary)[] }) {
  const parent = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (parent.current) {
      autoAnimate(parent.current);
    }
  }, [parent]);

  const handleDelete = (deckId: string) => {
    // Placeholder for delete functionality
    alert(`Delete action for deck ${deckId}`);
  };

  return (
    <div ref={parent} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {decks.map((d) => (
        <div
          key={d.id}
          className="group perspective-1000 block"
        >
          <div className="relative w-full aspect-[3/4] bg-white rounded-xl shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1.5 flex flex-col justify-between">
            <div className="flex-grow flex flex-col justify-center items-center p-4 text-center">
              <p className="text-lg font-semibold text-center text-gray-700">{'title' in d ? d.title : d.name}</p>
            </div>
            
            <div className="p-2 border-t border-gray-100 space-y-2">
                <Button asChild className="w-full opacity-0 group-hover:opacity-100 transition-opacity">
                     <Link href={`/decks/${d.id}/study`}>
                        <BookOpen className="mr-2 h-4 w-4"/>
                        Study
                    </Link>
                </Button>
                <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                   <Link href={`/decks/${d.id}/edit`} passHref>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                    </Button>
                   </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-600" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
}
