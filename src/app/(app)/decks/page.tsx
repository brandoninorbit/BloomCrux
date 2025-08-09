
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Deck as StitchDeck, Topic as StitchTopic } from '@/stitch/types';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUserAuth } from "@/app/Providers/AuthProvider";
import { getTopics } from "@/lib/firestore";
import Link from "next/link";

type Folder = { id: string; name: string; decks: StitchDeck[] };

type Mode =
  | { kind: "recent" }
  | { kind: "folder"; folderId: string; folderName: string };

export default function DecksPage() {
  const router = useRouter();
  const search = useSearchParams();
  const qFolder = search.get("folder");
  const { user } = useUserAuth();
  
  // This is the key change: use the real uid if available, otherwise fallback to 'demo-user'
  const uid = user?.uid || 'demo-user';

  const [mode, setMode] = useState<Mode>(qFolder ? { kind: "folder", folderId: qFolder, folderName: "..." } : { kind: "recent" });
  
  const [allDecks, setAllDecks] = useState<StitchDeck[]>([]);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);

  const [loading, setLoading] = useState(true);

  // Load all user data (topics/decks) once, using the determined uid
  useEffect(() => {
    (async () => {
      setLoading(true);
      // The uid will be either the logged-in user's or 'demo-user'
      const topics = await getTopics(uid);
      const decks = topics.flatMap(t => t.decks ?? []);
      
      const folders: Folder[] = topics.map(t => ({
        id: t.id,
        name: t.name,
        decks: t.decks ?? []
      }));

      setAllDecks(decks);
      setAllFolders(folders);
      setLoading(false);
    })();
  }, [uid]);

  // keep URL synced with view (optional but nice)
  useEffect(() => {
    if (mode.kind === "folder") {
      router.replace(`/decks?folder=${mode.folderId}`);
    } else {
      router.replace(`/decks`);
    }
  }, [mode, router]);


  const recentDecks = useMemo(() => {
    // A simple sort by ID for now, a real app would use a timestamp
    return [...allDecks].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 8);
  }, [allDecks]);

  const currentFolderDecks = useMemo(() => {
    if (mode.kind !== 'folder') return [];
    const folder = allFolders.find(f => f.id === mode.folderId);
    return folder?.decks ?? [];
  }, [mode, allFolders]);
  
  const heading = useMemo(() => {
    if (mode.kind === "recent") return "Recent Decks";
    const folder = allFolders.find(f => f.id === (mode as any).folderId);
    return `Folder: ${folder?.name || '...'}`;
  }, [mode, allFolders]);

  function openFolder(f: Folder) {
    setMode({ kind: "folder", folderId: f.id, folderName: f.name });
  }

  function backToRecent() {
    setMode({ kind: "recent" });
  }

  const decksToShow = mode.kind === "recent" ? recentDecks : currentFolderDecks;

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header row swaps actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{heading}</h2>

        {mode.kind === "recent" ? (
          <div className="flex gap-2">
            <Button variant="secondary">New Set</Button>
            <Button>New Folder</Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={backToRecent}>
              Back to Recent Decks
            </Button>
          </div>
        )}
      </div>

      {/* Top grid swaps between recent and folder decks */}
      <section>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : decksToShow && decksToShow.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {decksToShow.map(d => (
              <Link key={d.id} href={`/decks/${d.id}/study`} className="rounded-xl border p-6 hover:shadow-sm">
                {d.title}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No decks yet.</p>
        )}
      </section>

      {/* Folders section stays visible for quick switching */}
      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Folders</h3>
        {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
        ) : allFolders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allFolders.map(f => (
                <button
                key={f.id}
                onClick={() => openFolder(f)}
                className="rounded-2xl border p-4 text-left hover:shadow-sm"
                aria-label={`Open folder ${f.name}`}
                >
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.decks.length ?? "—"} sets</div>
                </button>
            ))}
            </div>
        ) : (
            <p className="text-sm text-muted-foreground">No folders created yet.</p>
        )}
      </section>
    </main>
  );
}
