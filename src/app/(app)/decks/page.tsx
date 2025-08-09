
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase"; // client SDK init
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUserAuth } from "@/app/Providers/AuthProvider";

type Deck = {
  id: string;
  name: string;
  folderId?: string | null;
  ownerUid: string;
  updatedAt?: any;
};

type Folder = { id: string; name: string; ownerUid: string; count?: number };

type Mode =
  | { kind: "recent" }
  | { kind: "folder"; folderId: string; folderName: string; count?: number };

export default function DecksPage() {
  const router = useRouter();
  const search = useSearchParams();
  const qFolder = search.get("folder"); // keep URL in sync, optional
  const { user } = useUserAuth();
  const uid = user?.uid ?? "demo-user"; // replace with user?.uid

  const [mode, setMode] = useState<Mode>(qFolder ? { kind: "folder", folderId: qFolder, folderName: "..." } : { kind: "recent" });
  const [recent, setRecent] = useState<Deck[] | null>(null);
  const [folderDecks, setFolderDecks] = useState<Deck[] | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);

  // Load folders list (for the “Folders” section)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDocs(query(collection(db, "folders"), where("ownerUid", "==", uid)));
      setFolders(snap.docs.map(d => ({ id: d.id, ...(d.data() as Folder) })));
    })();
  }, [uid, user]);

  // Load recent decks on first paint or when returning to Recent
  useEffect(() => {
    if (mode.kind !== "recent" || recent || !user) return;
    (async () => {
      setLoading(true);
      const snap = await getDocs(
        query(
          collection(db, "decks"),
          where("ownerUid", "==", uid),
          orderBy("updatedAt", "desc"),
          limit(8)
        )
      );
      setRecent(snap.docs.map(d => ({ id: d.id, ...(d.data() as Deck) })));
      setLoading(false);
    })();
  }, [mode, recent, uid, user]);

  // Load folder decks when a folder mode is set
  useEffect(() => {
    if (mode.kind !== "folder" || !user) return;
    (async () => {
      setLoading(true);

      // fetch folder name (so the heading says “Folder: Name”)
      const f = await getDoc(doc(db, "folders", mode.folderId));
      const folderName = f.exists() ? (f.data()?.name as string) : "Folder";
      const count = f.exists() ? (f.data()?.count as number | undefined) : undefined;

      const ds = await getDocs(
        query(collection(db, "decks"), where("ownerUid", "==", uid), where("folderId", "==", mode.folderId))
      );
      setFolderDecks(ds.docs.map(d => ({ id: d.id, ...(d.data() as Deck) })));
      setMode({ kind: "folder", folderId: mode.folderId, folderName, count });
      setLoading(false);
    })();
  }, [mode, uid, user]);

  // keep URL synced with view (optional but nice)
  useEffect(() => {
    if (mode.kind === "folder") router.replace(`/decks?folder=${mode.folderId}`);
    else router.replace(`/decks`);
  }, [mode, router]);

  const heading = useMemo(() => {
    if (mode.kind === "recent") return "Recent Decks";
    const suffix = mode.count != null ? ` (${mode.count} sets)` : "";
    return `Folder: ${mode.folderName}${suffix}`;
  }, [mode]);

  function openFolder(f: Folder) {
    setFolderDecks(null);
    setMode({ kind: "folder", folderId: f.id, folderName: f.name, count: f.count });
  }

  function backToRecent() {
    setMode({ kind: "recent" });
    // keep recent in memory so it pops back instantly
  }

  const decksToShow = mode.kind === "recent" ? recent : folderDecks;

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
        {loading && (!decksToShow || decksToShow.length === 0) ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : decksToShow && decksToShow.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {decksToShow.map(d => (
              <a key={d.id} href={`/decks/${d.id}/study`} className="rounded-xl border p-6 hover:shadow-sm">
                {d.name}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No decks yet.</p>
        )}
      </section>

      {/* Folders section stays visible for quick switching */}
      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Folders</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => openFolder(f)}
              className="rounded-2xl border p-4 text-left hover:shadow-sm"
              aria-label={`Open folder ${f.name}`}
            >
              <div className="font-medium">{f.name}</div>
              <div className="text-xs text-muted-foreground">{f.count ?? "—"} sets</div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
