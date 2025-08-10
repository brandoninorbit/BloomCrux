
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useUserAuth } from "@/context/AuthContext";
import { getUserDecks } from "@/adapters/decks";
import type { DeckSummary, FolderSummary, BloomLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DeckCardGrid } from "@/components/DeckCardGrid";
import Link from "next/link";
import { EditFolderDialog } from "@/components/folders/EditFolderDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore";
import { useGuestFolders } from "@/stores/useGuestFolders";
import FrameTester from "@/components/FrameTester";


type DeckWithProgress = DeckSummary & {
  progress?: {
    percent: number;
    bloomLevel: BloomLevel;
  };
  folderId?: string;
  updatedAt?: number;
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
  createdAtMs: number;
};

type DeckForSwitcher = { id: string, name: string, progress?: DeckWithProgress['progress'] };
type FolderForSwitcher = { id: string, name: string, decks: DeckForSwitcher[] };

const MOCK_DECKS: DeckWithProgress[] = [
  { id: "m1", name: "Biology 101", progress: { percent: 34, bloomLevel: "Understand" }, folderId: "f1", updatedAt: Date.now() - 10000 },
  { id: "m2", name: "Spanish Vocabulary", progress: { percent: 72, bloomLevel: "Apply" }, folderId: "f2", updatedAt: Date.now() - 20000 },
  { id: "m3", name: "World History", progress: { percent: 10, bloomLevel: "Remember" }, folderId: "f3", updatedAt: Date.now() - 30000 },
  { id: "m4", name: "Organic Chemistry", progress: { percent: 0, bloomLevel: "Remember" }, folderId: "f1", updatedAt: Date.now() - 40000 },
  { id: "m5", name: "Anatomy", progress: { percent: 95, bloomLevel: "Evaluate" }, folderId: "f1", updatedAt: Date.now() - 50000 },
  { id: "m6", name: "Intro to Physics", progress: { percent: 22, bloomLevel: "Apply" }, folderId: "f1", updatedAt: Date.now() - 60000 },
];

function DeckAreaSwitcher({
  recentDecks,
  folders,
  initialFolderId = null,
  onNewSet,
  onNewFolder,
}: {
  recentDecks: DeckForSwitcher[],
  folders: FolderForSwitcher[],
  initialFolderId?: string | null,
  onNewSet: (folderId: string) => void,
  onNewFolder: () => void,
}) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(initialFolderId);
  const [listParent] = useAutoAnimate({ duration: 220, easing: "ease-in-out" });
  const prefersReduced = useReducedMotion();

  const activeFolder = useMemo(
    () => folders.find(f => f.id === activeFolderId) ?? null,
    [folders, activeFolderId]
  );

  const showingFolderDecks = !!activeFolder;
  const title = showingFolderDecks ? activeFolder!.name : "Recent Decks";
  const visibleDecks = showingFolderDecks ? activeFolder!.decks : recentDecks;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeFolderId]);

  const headerVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  const listVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.04 } },
    exit: { opacity: 0, y: -6 },
  };
  
  const itemVariants = {
      hidden: { opacity: 0, scale: 0.97 },
      show: { opacity: 1, scale: 1 }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-[40px] relative flex-grow">
            <AnimatePresence mode="wait">
                <motion.h2
                    key={title}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    variants={prefersReduced ? {} : headerVariants}
                    transition={{ duration: 0.22 }}
                    className="text-2xl font-semibold tracking-tight absolute"
                >
                    {title}
                    {showingFolderDecks ? (
                        <span className="ml-2 text-sm text-muted-foreground">({visibleDecks.length} {visibleDecks.length === 1 ? "deck" : "decks"})</span>
                    ) : null}
                </motion.h2>
            </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-2">
            {showingFolderDecks && (
                <Button onClick={() => setActiveFolderId(null)} variant="ghost" className="hover:bg-slate-100">
                    Back to Recent
                </Button>
            )}
            <Button onClick={showingFolderDecks ? () => onNewSet(activeFolderId!) : onNewFolder}>
                {showingFolderDecks ? "New Set" : "New Folder"}
            </Button>
        </div>
      </div>
      
      <div ref={listParent} className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={showingFolderDecks ? `folder-${activeFolder?.id}` : "recents"}
            variants={prefersReduced ? {} : listVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            <DeckCardGrid decks={visibleDecks as any} />
          </motion.div>
        </AnimatePresence>
      </div>
      
      <section>
          <h2 className="text-2xl font-semibold mb-4">Folders</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {folders.map(f => (
                <motion.div
                    key={f.id}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                    <div
                        onClick={() => setActiveFolderId(f.id)}
                        className={`text-left w-full bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border-2 ${activeFolderId === f.id ? 'border-primary' : 'border-slate-100'} p-5 flex items-center gap-4 cursor-pointer`}
                    >
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-100">
                            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                                <path d="M4 11h16v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7z" />
                                <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                            </svg>
                        </div>
                        <div>
                            <div className="font-semibold text-slate-800">{f.name}</div>
                            <div className="text-slate-500 text-sm">{f.decks.length} sets</div>
                        </div>
                    </div>
                </motion.div>
            ))}
           </div>
      </section>

    </div>
  );
}


export default function DecksClient() {
  const { user } = useUserAuth();
  const [decks, setDecks] = useState<DeckWithProgress[] | null>(null);
  const router = useRouter();

  const [folders, setFolders] = useState<UiFolder[] | null>(null);
  const guestFolders = useGuestFolders((s) => s.folders);

  useEffect(() => {
    if (!user?.uid) {
      setDecks(MOCK_DECKS);
      const ui = guestFolders.map((g) => ({
        id: g.id, name: g.name, color: g.color, createdAtMs: g.createdAt, setCount: 0,
      }));
      setFolders(ui);
      return;
    }
    
    const q = query(collection(db, "users", user.uid, "folders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items: UiFolder[] = snap.docs.map((d) => {
        const data = d.data() as FolderDoc;
        return {
          id: d.id, name: data.name, color: data.color,
          setCount: data.setCount || 0,
          createdAtMs: (data.createdAt as Timestamp)?.toMillis() ?? 0,
        };
      });
      setFolders(items);
    }, (err) => {
        console.error("folders onSnapshot error", err);
        setFolders([]);
    });

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


  const { recentDecks, foldersWithDecks } = useMemo(() => {
    const allDecks: DeckWithProgress[] = decks ?? [];
    
    const sortKey = (d: any) => d.updatedAt ?? 0;
    const recents = [...allDecks].sort((a, b) => Number(sortKey(b)) - Number(sortKey(a))).slice(0, 5);

    const fwd = (folders ?? []).map(f => {
      const folderDecks = allDecks.filter(d => d.folderId === f.id);
      return {
        id: f.id,
        name: f.name,
        decks: folderDecks.map(d => ({ id: d.id, name: d.name, progress: d.progress }))
      }
    });

    return { recentDecks: recents, foldersWithDecks: fwd };
  }, [decks, folders]);

  const handleNewSet = (folderId: string) => {
    router.push(`/decks/new?folderId=${folderId}`);
  };

  const handleNewFolder = () => {
    router.push('/decks/folders/new');
  };

  const loading = user ? (decks === null || folders === null) : false;

  if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }

  return (
    <>
      <FrameTester />
      <main className="py-8 relative">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <DeckAreaSwitcher
                  recentDecks={recentDecks}
                  folders={foldersWithDecks}
                  onNewSet={handleNewSet}
                  onNewFolder={handleNewFolder}
              />
          </div>
        </div>
      </main>
    </>
  );
}
