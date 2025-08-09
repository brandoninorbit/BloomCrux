
"use client";

import { useEffect, useState } from "react";
import { useUserAuth } from "@/context/AuthContext";
import { getUserDecks, getUserFolders } from "@/adapters/decks";
import type { DeckSummary, FolderSummary } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil } from "lucide-react";
import { DeckGrid } from "@/components/DeckGrid";
import Link from "next/link";


/** Local, file-scoped mocks (used only when logged out) */
const MOCK_DECKS: DeckSummary[] = [
  { id: "m1", name: "Biology 101" },
  { id: "m2", name: "Spanish Vocabulary" },
  { id: "m3", name: "World History" },
  { id: "m4", name: "Organic Chemistry" },
];
const MOCK_FOLDERS: FolderSummary[] = [
  { id: "f1", name: "Science", setCount: 12 },
  { id: "f2", name: "Languages", setCount: 8 },
  { id: "f3", name: "Humanities", setCount: 4 },
];


function FolderCard({
  name,
  sets,
  color = "bg-blue-100 text-blue-600",
  onClick,
}: {
  name: string;
  sets: number;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="group w-full text-left bg-white rounded-2xl shadow-md p-5 flex items-center gap-5
                 hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <button
        onClick={onClick}
        className={`w-12 h-12 rounded-lg flex items-center justify-center 
                    ${color}`}
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M4 11h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7z" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      </button>
      <div className="flex-grow">
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">{sets} sets</p>
      </div>
      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-600">
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}


function SkeletonRow() { 
    return (
        <div className="space-y-4">
            <div className="h-24 rounded-lg bg-muted/40 animate-pulse" />
            <div className="h-24 rounded-lg bg-muted/40 animate-pulse" />
        </div>
    ); 
}


export default function DecksClient() {
  const { user } = useUserAuth(); // null when logged out
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);   // null = loading
  const [folders, setFolders] = useState<FolderSummary[] | null>(null);

  useEffect(() => {
    if (!user) {
      // Logged out: show mocks, not real fetch
      setDecks(MOCK_DECKS);
      setFolders(MOCK_FOLDERS);
      return;
    }
    // Logged in: load real data
    setDecks(null); setFolders(null);
    (async () => {
      const [d, f] = await Promise.all([
        getUserDecks(user.uid),
        getUserFolders(user.uid),
      ]);
      setDecks(d); setFolders(f);
    })();
  }, [user]);

  const loading = user && (decks === null || folders === null);

  return (
    <main className="py-8 relative">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Recent Decks</h2>
                {user && (
                    <div className="flex gap-2">
                      <Button variant="secondary" asChild><Link href="/decks/new">New Set</Link></Button>
                      <Button asChild><Link href="/decks/folders/new">New Folder</Link></Button>
                    </div>
                )}
              </div>
              {loading ? (
                <SkeletonRow />
              ) : decks && decks.length > 0 ? (
                <DeckGrid decks={decks as any} />
              ) : (
                <p className="text-muted-foreground">No recent decks.</p>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Folders</h2>
              {loading ? (
                <SkeletonRow />
              ) : folders && folders.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {folders.map((f) => (
                      <FolderCard
                        key={f.id}
                        name={f.name}
                        sets={f.setCount || 0}
                      />
                    ))}
                  </div>
              ) : (
                <p className="text-muted-foreground">No folders created yet.</p>
              )}
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
