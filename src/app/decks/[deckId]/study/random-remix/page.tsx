
'use client';

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserAuth } from "@/context/AuthContext";
import { getOrCreateRemixSession, advanceRemix } from "@/lib/remix";
import { getAllCardsForDeck, getCardById, logCardAttempt, getUserProgress } from "@/lib/firestore";
import type { Flashcard, GlobalProgress } from "@/types";
import { StudyMissionLayout } from "@/components/StudyMissionLayout";
import { StudyCard } from "@/components/StudyCard";
import { Loader2 } from "lucide-react";
import MissionComplete from "@/components/MissionComplete";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type RemixSession = {
  id: string;
  deckId: string;
  order: string[];
  currentIndex: number;
  totalCards: number;
  startedAt: any;
  updatedAt: any;
  deckTitle?: string;
};

const isRemixSession = (v: any): v is RemixSession =>
  v && Array.isArray(v.order) && typeof v.currentIndex === "number";

export default function RandomRemixPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useUserAuth();
  const [session, setSession] = useState<any>(null);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const router = useRouter();
  const [globalProgress, setGlobalProgress] = useState<GlobalProgress | null>(null);

  const fetchSession = useCallback(async () => {
    if (!user?.uid || !deckId) {
      setLoading(false);
      return;
    };
    setLoading(true);
    try {
      const { global } = await getUserProgress(user.uid);
      setGlobalProgress(global);
      const s = await getOrCreateRemixSession({
        uid: user.uid,
        deckId,
        fetchAllCardsInDeck: (id) => getAllCardsForDeck(user.uid, id)
      });
      
      if(!isRemixSession(s)) {
          setLoading(false);
          return;
      }

      if(s.currentIndex >= s.order.length) {
          setSession(s);
          setCurrentCard(null);
          setLoading(false);
          return;
      }

      const currentId = s.order[s.currentIndex];
      const c = currentId ? await getCardById(user.uid, deckId, currentId) : null;
      setSession(s);
      setCurrentCard(c);
    } catch (error) {
        console.error("Failed to load remix session", error);
        router.push(`/decks/${deckId}/study`);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, deckId, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const percent = useMemo(() => {
    if (!isRemixSession(session) || !session?.totalCards || session.totalCards === 0) return 0;
    return Math.floor(100 * (session.currentIndex) / session.totalCards);
  }, [session]);

  const handleNextCard = async () => {
    if (!user?.uid || !isRemixSession(session)) return;
    setChecking(true);
    await advanceRemix(user.uid, deckId as string);

    const s = await getOrCreateRemixSession({
      uid: user.uid,
      deckId: deckId as string,
      fetchAllCardsInDeck: (id) => getAllCardsForDeck(user.uid, id)
    });
    
    if (!isRemixSession(s) || s.currentIndex >= s.order.length) {
        setSession(s);
        setCurrentCard(null);
        setChecking(false);
        return;
    }

    const currentId = s.order[s.currentIndex];
    const c = currentId ? await getCardById(user.uid, deckId, currentId) : null;

    setSession(s);
    setCurrentCard(c);
    setChecking(false);
  };
  
  const handleLogAttempt = (card: Flashcard, wasCorrect: boolean) => {
    if (user) {
        logCardAttempt(user.uid, {
            deckId: deckId,
            cardId: String(card.id),
            bloomLevel: card.bloomLevel,
            wasCorrect: wasCorrect,
            timestamp: new Date()
        });
    }
  };

  const handleRestart = async () => {
    if (!user?.uid || !deckId) return;
    setLoading(true);
    const sessionRef = doc(db, "users", user.uid, "remixSessions", deckId);
    await deleteDoc(sessionRef);
    fetchSession();
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentCard || !isRemixSession(session)) {
    return (
       <MissionComplete
            modeName="Random Remix"
            deckName={isRemixSession(session) ? (session.deckTitle || "Deck") : "Deck"}
            xp={150} // Placeholder
            coins={75} // Placeholder
            accuracy={92} // Placeholder
            questionsAnswered={isRemixSession(session) ? session.totalCards : 0}
            onReturnHQ={() => router.push('/dashboard')}
            onRestartMission={handleRestart}
            globalProgress={globalProgress}
        />
    );
  }

  return (
    <StudyMissionLayout
        deckTitle={session?.deckTitle || "Random Remix"}
        progress={percent}
        tokens={0}
        powerUpsExpanded={false}
        setPowerUpsExpanded={() => {}}
        onUsePowerUp={() => {}}
        purchaseCounts={{}}
    >
       <main className="w-full">
            <StudyCard
                card={currentCard}
                onLogAttempt={handleLogAttempt}
                onNextCard={handleNextCard}
                deckId={deckId}
                isRetryArmed={false}
                onUseRetry={() => {}}
            />
       </main>
    </StudyMissionLayout>
  );
}
