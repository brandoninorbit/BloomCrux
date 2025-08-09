
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deterministicShuffle } from "@/lib/utils/shuffle";
import type { BloomLevel, Flashcard } from "@/types";

const BLOOM_ORDER: BloomLevel[] = ["Remember","Understand","Apply","Analyze","Evaluate","Create"];

export async function getOrCreateQuestSession(opts: {
  uid: string,
  deckId: string,
  fetchCardsByLevel: (level: BloomLevel) => Promise<Flashcard[]>
}) {
  const { uid, deckId, fetchCardsByLevel } = opts;
  const ref = doc(db, "users", uid, "questSessions", deckId);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: ref.id, ...snap.data() };

  // Create session: only shuffle Remember now
  const rememberCards = await fetchCardsByLevel("Remember");
  const rememberOrder = deterministicShuffle(
    rememberCards.map(c => c.id),
    `${uid}:${deckId}:Remember`
  );

  const levelsPresent = BLOOM_ORDER.filter(lvl =>
    lvl === "Remember" // For now, assume all levels might be present, logic will handle empty ones
  );

  const session = {
    deckId,
    levels: levelsPresent,
    currentLevel: "Remember" as BloomLevel,
    currentIndex: 0,
    progressByLevel: { Remember: rememberOrder } as Record<BloomLevel, string[]>,
    completedLevels: [] as BloomLevel[],
    totalCards: rememberOrder.length, // Start with the count of the first level
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, session);
  return { id: ref.id, ...session };
}

export async function ensureLevelOrder(opts: {
  uid: string, deckId: string, level: BloomLevel,
  fetchCardsByLevel: (level: BloomLevel) => Promise<Flashcard[]>
}) {
  const { uid, deckId, level, fetchCardsByLevel } = opts;
  const ref = doc(db, "users", uid, "questSessions", deckId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Session missing");
  const data = snap.data() as any;
  if (data.progressByLevel?.[level]?.length) return;

  const cards = await fetchCardsByLevel(level);
  if(cards.length === 0) return; // Don't add empty levels

  const order = deterministicShuffle(cards.map(c => c.id), `${uid}:${deckId}:${level}`);
  await updateDoc(ref, {
    [`progressByLevel.${level}`]: order,
    totalCards: (data.totalCards || 0) + order.length,
    levels: [...(data.levels || []), level],
    updatedAt: serverTimestamp()
  });
}

export async function advance(opts: {
  uid: string, deckId: string
}) {
  const ref = doc(db, "users", opts.uid, "questSessions", opts.deckId);
  const snap = await getDoc(ref);
  if(!snap.exists()) return;
  const s = snap.data() as any;

  const order = s.progressByLevel[s.currentLevel] as string[];
  const nextIndex = s.currentIndex + 1;

  if (nextIndex < order.length) {
    await updateDoc(ref, { currentIndex: nextIndex, updatedAt: serverTimestamp() });
    return;
  }

  // finished this level → move to next
  const currentLevelIndex = BLOOM_ORDER.indexOf(s.currentLevel);
  const completed = [...s.completedLevels, s.currentLevel];

  // Find the next level in BLOOM_ORDER that exists in the deck
  let nextLevel: BloomLevel | undefined = undefined;
  for (let i = currentLevelIndex + 1; i < BLOOM_ORDER.length; i++) {
       // A level is considered "present" if we eventually populate its order array
       // For now, we optimistically move to the next in sequence. 
       // The calling function will handle fetching/creating the card order.
       nextLevel = BLOOM_ORDER[i];
       break; 
  }


  if (!nextLevel) {
    await updateDoc(ref, { completedLevels: completed, updatedAt: serverTimestamp() });
    return; // quest complete
  }

  await updateDoc(ref, {
    completedLevels: completed,
    currentLevel: nextLevel,
    currentIndex: 0,
    updatedAt: serverTimestamp()
  });
}
