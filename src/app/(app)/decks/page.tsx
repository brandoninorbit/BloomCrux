
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserAuth } from "@/context/AuthContext"; // your hook
// Firestore imports must only run for authed users
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import {
  MOCK_DECKS_RECENT,
  MOCK_DECKS_BY_FOLDER,
  MOCK_FOLDERS,
} from "@/mock/decks";

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
  const [loading, setLoading] = useState(false);

  // Clear mocks if user logs in after seeing them
  useEffect(() => {
    if (user) {
      setFolders([]);
      setRecent(null);
      setFolderDecks(null);
    }
  }, [user]);
  
  // MASTER loader: choose data source once auth state is known
  useEffect(() => {
    if (authLoading) return;

    // Signed out path
    if (!user) {
      if (mockRequested) {
        // MOCK: never hit Firestore
        setFolders(MOCK_FOLDERS);
        setRecent(MOCK_DECKS_RECENT);
      } else {
        // Empty state by design
        setFolders([]);
        setRecent([]);
      }
      return;
    }

    // Authed path -> Firestore
    (async () => {
      setLoading(true);
      // Folders
      const fSnap = await getDocs(query(collection(db, "folders"), where("ownerUid", "==", user.uid)));
      setFolders(fSnap.docs.map(d => ({ id: d.id, ...(d.data() as Folder) })));
      // Recent decks
      const dSnap = await getDocs(
        query(collection(db, "decks"), where("ownerUid", "==", user.uid), orderBy("updatedAt", "desc"), limit(8))
      );
      setRecent(dSnap.docs.map(d => ({ id: d.id, ...(d.data() as Deck) })));
      setLoading(false);
    })();
  }, [user, authLoading]);

  // When switching to a folder
  useEffect(() => {
    if (mode.kind !== "folder") return;

    if (!user) {
      // MOCK / signed-out path
      const name = MOCK_FOLDERS.find(f => f.id === mode.folderId)?.name ?? "Folder";
      const count = MOCK_FOLDERS.find(f => f.id === mode.folderId)?.count;
      setMode({ kind: "folder", folderId: mode.folderId, folderName: name, count });
      setFolderDecks(MOCK_DECKS_BY_FOLDER[mode.folderId] ?? []);
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

  const decksToShow = mode.kind === "recent" ? recent : folderDecks;

  function openFolder(f: Folder) {
    setFolderDecks(null);
    setMode({ kind: "folder", folderId: f.id, folderName: f.name, count: f.count });
  }
  function backToRecent() {
    setMode({ kind: "recent" });
  }

  return (
    <main className="py-8 relative">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{heading}</h2>
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
            {loading && (!decksToShow || decksToShow.length === 0) ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : decksToShow && decksToShow.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {decksToShow.map(d => (
                  <a key={d.id} href={`/decks/${d.id}`} className="rounded-xl border p-6 hover:shadow-sm">
                    {d.name}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No decks yet.</p>
            )}
          </section>

          {/* Folders list (always visible) */}
          <section className="space-y-3">
            <h3 className="text-xl font-semibold">Folders</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {folders.map(f => (
                <button key={f.id} onClick={() => openFolder(f)} className="rounded-2xl border p-4 text-left hover:shadow-sm">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.count ?? "—"} sets</div>
                </button>
              ))}
              {folders.length === 0 && <p className="text-sm text-muted-foreground">No folders created yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
