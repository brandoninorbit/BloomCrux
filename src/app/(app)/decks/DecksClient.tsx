
"use client";

import { useEffect, useState, useRef } from "react";
import autoAnimate from "@formkit/auto-animate";
import { useUserAuth } from "@/context/AuthContext";
import { getUserDecks } from "@/adapters/decks";
import type { DeckSummary, FolderSummary, BloomLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil } from "lucide-react";
import { DeckCardGrid } from "@/components/DeckCardGrid";
import Link from "next/link";
import { EditFolderDialog } from "@/components/folders/EditFolderDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import { useGuestFolders } from "@/stores/useGuestFolders";


type DeckWithProgress = DeckSummary & {
  progress?: {
    percent: number;
    bloomLevel: BloomLevel;
  };
  folderId?: string; // Add folderId for filtering
  updatedAt?: number; // For sorting recents
};

type FolderDoc = {
  ownerId: string;
  name: string;
  color: string;
  createdAt?: Timestamp | null;
  setCount?: number;
};

type UiFolder = {
  id: string;
  name: string;
  color: string;
  setCount: number;
  createdAtMs: number; // normalized for sorting/display
};


/** Local, file-scoped mocks (used only when logged out) */
const MOCK_DECKS: DeckWithProgress[] = [
  { id: "m1", name: "Biology 101", progress: { percent: 34, bloomLevel: "Understand" }, folderId: "f1", updatedAt: Date.now() - 10000 },
  { id: "m2", name: "Spanish Vocabulary", progress: { percent: 72, bloomLevel: "Apply" }, folderId: "f2", updatedAt: Date.now() - 20000 },
  { id: "m3", name: "World History", progress: { percent: 10, bloomLevel: "Remember" }, folderId: "f3", updatedAt: Date.now() - 30000 },
  { id: "m4", name: "Organic Chemistry", progress: { percent: 0, bloomLevel: "Remember" }, folderId: "f1", updatedAt: Date.now() - 40000 },
  { id: "m5", name: "Anatomy", progress: { percent: 95, bloomLevel: "Evaluate" }, folderId: "f1", updatedAt: Date.now() - 50000 },
  { id: "m6", name: "Intro to Physics", progress: { percent: 22, bloomLevel: "Apply" }, folderId: "f1", updatedAt: Date.now() - 60000 },
];


function colorToClass(color: string = "blue") {
  switch (color) {
    case "green": return "bg-green-100 text-green-600";
    case "yellow": return "bg-yellow-100 text-yellow-600";
    case "purple": return "bg-purple-100 text-purple-600";
    case "pink": return "bg-pink-100 text-pink-600";
    case "orange": return "bg-orange-100 text-orange-600";
    case "gray": return "bg-gray-100 text-gray-600";
    case "blue":
    default: return "bg-blue-100 text-blue-600";
  }
}

function FolderCard({ folder, onEdit, onClick }: { folder: UiFolder, onEdit: (e: React.MouseEvent) => void, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className="group w-full text-left bg-white rounded-2xl shadow-md p-5 flex items-center gap-5
                 transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center 
                    ${colorToClass(folder.color)}`}
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M4 11h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7z" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      </div>
      <div className="flex-grow">
        <p className="font-semibold">{folder.name}</p>
        <p className="text-sm text-muted-foreground">{folder.setCount || 0} sets</p>
      </div>
      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-600" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}


function SkeletonRow() { 
  const SkeletonCard = () => (
    <div className="h-48 rounded-2xl bg-slate-100 overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
        </div>
    ); 
}


export default function DecksClient() {
  const { user } = useUserAuth();
  const [decks, setDecks] = useState<DeckWithProgress[] | null>(null);
  
  const [editingFolder, setEditingFolder] = useState<UiFolder | null>(null);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const router = useRouter();
  const folderGridRef = useRef<HTMLDivElement>(null);
  const deckGridRef = useRef<HTMLDivElement>(null);

  // --- folder state ---
  const [folders, setFolders] = useState<UiFolder[] | null>(null);
  const guestFolders = useGuestFolders((s) => s.folders);
  const addGuestFolder = useGuestFolders((s) => s.addFolder);

  // --- state & selectors for folder view ---
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // helper to get recent decks (assumes each deck has updatedAt; fallback to original order)
  const sortKey = (d: any) => d.updatedAt ?? 0;
  const allDecks: DeckWithProgress[] = decks ?? [];
  const recentDecks = [...allDecks].sort((a, b) => Number(sortKey(b)) - Number(sortKey(a))).slice(0, 5);

  const selectedFolder = selectedFolderId ? (folders ?? []).find((f) => f.id === selectedFolderId) : null;
  const folderDecks = selectedFolderId ? allDecks.filter((d) => d.folderId === selectedFolderId) : [];
  const visibleDecks = selectedFolderId ? folderDecks : recentDecks;

  const heading = selectedFolder
    ? `${selectedFolder.name} (${folderDecks.length} ${folderDecks.length === 1 ? "set" : "sets"})`
    : "Recent Decks";


  useEffect(() => {
    if (folderGridRef.current) autoAnimate(folderGridRef.current);
    if (deckGridRef.current) autoAnimate(deckGridRef.current);
  }, [folderGridRef, deckGridRef]);


  useEffect(() => {
    if (!user?.uid) {
      // Guest mode
      setDecks(MOCK_DECKS);
      const ui = guestFolders.map((g) => ({
        id: g.id, name: g.name, color: g.color, createdAtMs: g.createdAt, setCount: 0,
      }));
      setFolders(ui);
      return;
    }
    
    // Signed-in mode (real time for folders)
    const q = query(
      collection(db, "users", user.uid, "folders"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const items: UiFolder[] = snap.docs.map((d) => {
        const data = d.data() as FolderDoc;
        return {
          id: d.id,
          name: data.name,
          color: data.color,
          setCount: data.setCount || 0,
          createdAtMs: (data.createdAt as Timestamp)?.toMillis() ?? 0,
        };
      });
      setFolders(items);
    }, (err) => {
        console.error("folders onSnapshot error", err);
        setFolders([]); // fail closed
    });

    // One-time deck fetch
    setDecks(null);
    (async () => {
      const d = await getUserDecks(user.uid);
      const decksWithMockProgress = d.map((deck, i) => ({
        ...deck,
        progress: {
          percent: (i * 20 + 5) % 100,
          bloomLevel: (['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] as BloomLevel[])[i % 6]
        },
        folderId: folders?.[i % (folders?.length || 1)]?.id,
        updatedAt: Date.now() - (i * 10000)
      }));
      setDecks(decksWithMockProgress);
    })();
    
    return () => unsub();
  }, [user?.uid, guestFolders]);

  const handleUpdateFolder = (updatedFolder: UiFolder) => {
    setFolders(currentFolders => 
        (currentFolders ?? []).map(f => f.id === updatedFolder.id ? updatedFolder : f)
    );
  };
  
  const handleCreateFolder = (newFolder: UiFolder) => {
    setFolders(currentFolders => [...(currentFolders ?? []), newFolder]);
  };
  
  const handleNewSetClick = () => {
    if (!user && (folders ?? []).length === 0) {
        // Guest user with no folders - prompt to create one first.
        router.push('/decks/folders/new');
        return;
    }

    if (folders && folders.length > 0 && !selectedFolder) {
      setShowFolderDialog(true);
    } else {
       const path = selectedFolderId ? `/decks/new?folderId=${selectedFolderId}` : '/decks/new';
       router.push(path);
    }
  };

  const handleSelectFolderForNewSet = (folderId: string) => {
    setShowFolderDialog(false);
    // You can pass the folderId as a query param to the edit page
    router.push(`/decks/new?folderId=${folderId}`);
  };


  const loading = user && (decks === null || folders === null);

  const gridParentVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 6 },
    show:   { opacity: 1, scale: 1,    y: 0 },
  };

  return (
    <main className="py-8 relative">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">{heading}</h2>
                <div className="flex gap-2">
                   {selectedFolder ? (
                    <>
                      <Button onClick={() => setSelectedFolderId(null)} variant="ghost" className="hover:bg-slate-100">
                        Back to Recent
                      </Button>
                      <Button onClick={handleNewSetClick}>New Set</Button>
                    </>
                  ) : (
                    <Button asChild><Link href="/decks/folders/new">New Folder</Link></Button>
                  )}
                </div>
              </div>
              {loading ? (
                <SkeletonRow />
              ) : decks && decks.length > 0 ? (
                 <motion.div
                    ref={deckGridRef}
                    variants={gridParentVariants}
                    initial="hidden"
                    animate="show"
                 >
                    <DeckCardGrid decks={visibleDecks} />
                 </motion.div>
              ) : (
                <p className="text-muted-foreground">{user ? "No recent decks." : "No recent decks."}</p>
              )}
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Folders</h2>
              {loading ? (
                <SkeletonRow />
              ) : folders && folders.length > 0 ? (
                 <motion.div 
                    ref={folderGridRef}
                    variants={gridParentVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
                 >
                    {folders.map((f) => (
                      <motion.div
                        key={f.id}
                        variants={itemVariants}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FolderCard
                          folder={f}
                          onClick={() => setSelectedFolderId(f.id)}
                          onEdit={(e) => { e.stopPropagation(); setEditingFolder(f); }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
              ) : (
                <p className="text-muted-foreground">{user ? "No folders created yet." : "No folders yet. Create one to get started!"}</p>
              )}
            </section>

          </div>
        </div>
      </div>
      {editingFolder && (
        <EditFolderDialog
          folder={editingFolder as unknown as FolderSummary}
          open={!!editingFolder}
          onOpenChange={(isOpen) => !isOpen && setEditingFolder(null)}
          onUpdated={(updated) => {
            handleUpdateFolder(updated as unknown as UiFolder);
            setEditingFolder(updated as unknown as UiFolder); // Keep dialog open with new data
          }}
        />
      )}
      <AlertDialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select a Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Which folder should this new set be created in?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-60 overflow-y-auto my-4 space-y-2">
            {(folders ?? []).map((folder) => (
              <Button
                key={folder.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleSelectFolderForNewSet(folder.id)}
              >
                {folder.name}
              </Button>
            ))}
             <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleSelectFolderForNewSet("unfiled")}
              >
                Unfiled
              </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

    