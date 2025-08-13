'use client';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp , getDbStrict } from '@/lib/firebase.client';
import {  getDb, getDbStrict } from '@/lib/firebase.client';
import { deterministicShuffle } from "@/lib/utils/shuffle";
import type { Flashcard, RemixSession } from "@/types";

export async function getOrCreateRemixSession(opts: {
  uid: string,
  deckId: string,
  fetchAllCardsInDeck: (deckId: string) => Promise<Flashcard[]>
}) : Promise<RemixSession> {
  const { uid, deckId, fetchAllCardsInDeck } = opts;
  const ref = doc(getDb(), "users", uid, "remixSessions", deckId);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: ref.id, ...(snap.data() as Omit<RemixSession,'id'>) };

  const cards = await fetchAllCardsInDeck(deckId);
  const order = deterministicShuffle(cards.map(c => c.id), `${uid}:${deckId}:remix`);

  const session = {
    deckId,
    order,
    currentIndex: 0,
    totalCards: order.length,
    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, session);
  return { id: ref.id, ...session };
}

export async function advanceRemix(uid: string, deckId: string) {
  const ref = doc(getDb(), "users", uid, "remixSessions", deckId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const s = snap.data() as any;
  const nextIndex = s.currentIndex + 1;

  await updateDoc(ref, {
    currentIndex: Math.min(nextIndex, s.totalCards),
    updatedAt: serverTimestamp(),
  });
}






