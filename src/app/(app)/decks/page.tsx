
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserAuth } from "@/context/AuthContext"; // your hook
// Firestore imports must only run for authed users
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Topic as StitchTopic, Deck as StitchDeck } from '@/stitch/types';
import { getTopics } from "@/lib/firestore";
import { MOCK_DECKS_RECENT, MOCK_FOLDERS, MOCK_DECKS_BY_FOLDER, type MockDeck, type MockFolder } from "@/mock/decks";
import { DeckGrid } from "@/components/DeckGrid";

// Force demo in Studio by visiting /decks?demo=1
const forceDemo =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("demo");

type Deck = { id: string; name: string; folderId?: string | null; updatedAt?: any };
type Folder = { id: string; name: string; count?: number };

type Mode =
  | { kind: "recent" }
  | { kind: "folder"; folderId: string; folderName: string; count?: number };

const mockRequested =
  typeof window !== "undefined" &&
  (new URLSearchParams(window.location.search).has("demo") ||
    process.env.NEXT_PUBLIC_USE_MOCK === "1");

export default function DecksPage() {
  const { user, loading: authLoading } = useUserAuth();
  const router = useRouter();
  const search = useSearchParams();
  const qFolder = search.get("folder");

  const [mode, setMode] = useState<Mode>(qFolder ? { kind: "folder", folderId: qFolder, folderName: "..." } : { kind: "recent" });
  const [recent, setRecent] = useState<Deck[] | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderDecks, setFolderDecks] = useState<Deck[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<StitchTopic[]>([]);

  useEffect(() => {
    if (user) {
      setFolders([]);        // clear mock
      setRecent(null);       // trigger real load
      setFolderDecks(null);
    }
  }, [user]);

  // MASTER loader: choose data source once auth state is known
  useEffect(() => {
    let on = true;
    (async () => {
      // Signed out OR demo → no Firestore calls, just render mocks
      if (!user || forceDemo) {
        if (on) {
          setTopics([]);     // we render mocks via the memo below
          setLoading(false); // stop spinner immediately
        }
        return;
      }
  
      // Logged in → load real topics
      try {
        const t = await getTopics(user.uid);
        if (on) setTopics(t ?? []);
      } catch {
        if (on) setTopics([]);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [user, forceDemo]);

  // When switching to a folder
  useEffect(() => {
    if (mode.kind !== "folder") return;

    if (!user) {
      if (mockRequested) {
        // MOCK / signed-out path
        const name = MOCK_FOLDERS.find(f => f.id === mode.folderId)?.name ?? "Folder";
        const count = MOCK_FOLDERS.find(f => f.id === mode.folderId)?.count;
        setMode({ kind: "folder", folderId: mode.folderId, folderName: name, count });
        setFolderDecks(MOCK_DECKS_BY_FOLDER[mode.folderId] ?? []);
      }
      return;
    }

    // Authed path → Firestore
    (async () => {
      setLoading(true);
      const f = await getDoc(doc(db, "folders", mode.folderId));
      const name = f.exists() ? (f.data()?.name as string) : "Folder";
      const count = f.exists() ? (f.data()?.count as number | undefined) : undefined;

      const ds = await getDocs(
        query(collection(db, "decks"), where("ownerUid", "==", user.uid), where("folderId", "==", mode.folderId))
      );
      setFolderDecks(ds.docs.map(d => ({ id: d.id, ...(d.data() as Deck) })));
      setMode({ kind: "folder", folderId: mode.folderId, folderName: name, count });
      setLoading(false);
    })();
  }, [mode, user]);

  // Sync URL (nice to have)
  useEffect(() => {
    if (mode.kind === "folder") router.replace(`/decks?folder=${mode.folderId}`);
    else router.replace(`/decks`);
  }, [mode, router]);

  const heading = useMemo(() => {
    if (mode.kind === "recent") return "Recent Decks";
    const suffix = mode.count != null ? ` (${mode.count} sets)` : "";
    return `Folder: ${mode.folderName}${suffix}`;
  }, [mode]);
  
  const recentDecks: StitchDeck[] = useMemo(() => {
    if (forceDemo || !user) return MOCK_DECKS_RECENT;
    const real = topics.flatMap((t) => t.decks || []).map(d => ({...d, title: d.title ?? (d as any).name}));
    return real.length ? real : [];
  }, [user, topics, forceDemo]);

  const decksToShow = mode.kind === 'recent' ? recentDecks : (folderDecks as StitchDeck[] | null);

  const foldersToShow: MockFolder[] = useMemo(() => {
      if (forceDemo || !user) return MOCK_FOLDERS;
      // This logic will need to be updated if real folders are stored separately
      return []; 
  }, [user, topics, forceDemo]);


  function openFolder(f: Folder) {
    setFolderDecks(null);
    setMode({ kind: "folder", folderId: f.id, folderName: f.name, count: f.count });
  }
  function backToRecent() {
    setMode({ kind: "recent" });
  }

  if (loading && !decksToShow) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="py-8 relative">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{heading} <span className="text-xs align-middle">[decks-v3]</span></h2>
              {mode.kind === "recent" ? (
                <div className="flex gap-2">
                  <Button variant="secondary">New Set</Button>
                  <Button>New Folder</Button>
                </div>
              ) : (
                <Button variant="secondary" onClick={backToRecent}>Back to Recent Decks</Button>
              )}
            </div>

            {/* Top grid (recent or folder decks) */}
            <section>
              {loading && !decksToShow ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin inline-block text-primary" />
                </div>
              ) : decksToShow && decksToShow.length > 0 ? (
                <DeckGrid decks={decksToShow as StitchDeck[]} />
              ) : (
                 <p className="text-sm text-muted-foreground">No decks yet.</p>
              )}
            </section>

            {/* Folders list (always visible) */}
            <section className="space-y-3">
              <h3 className="text-xl font-semibold">Folders</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {foldersToShow.map(f => (
                  <button key={f.id} onClick={() => openFolder(f)} className="rounded-2xl border p-4 text-left hover:shadow-sm">
                    <div className="font-medium">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.count ?? "—"} sets</div>
                  </button>
                ))}
                {foldersToShow.length === 0 && <p className="text-sm text-muted-foreground">No folders created yet.</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
