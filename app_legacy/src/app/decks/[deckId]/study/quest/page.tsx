
'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Flashcard, StandardMCQCard, CompareContrastCard, DragAndDropSortingCard, FillInTheBlankCard, ShortAnswerCard, TwoTierMCQCard, CERCard, SequencingCard, Topic, Deck, StudyMode, DeckProgress, UserPowerUps, PowerUpType, PurchaseCounts, CardFormat, UserXpStats, UserSettings, GlobalProgress } from '@/stitch/types';
import { Loader2, ArrowLeft, ArrowRight, Check, X, PartyPopper, Lightbulb, History, SkipForward, ShieldAlert, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import { getDeck, logCardAttempt, getUserDeckProgress, saveUserDeckProgress, getDeckPurchaseCounts, purchasePowerUp, getUserXpStats, getCardsForDeckByBloomLevel, getCardById, getUserProgress } from '@/lib/firestore';
import { getDb, db } from '@/lib/firebase';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StudyMissionLayout } from '@/components/StudyMissionLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyCard } from '@/components/StudyCard';
import { collection, getDocs, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useUserSettings } from '@/hooks/useUserSettings';
import { getOrCreateQuestSession, ensureLevelOrder, advance } from "@/lib/quest";
import MissionComplete from '@/components/MissionComplete';

type BloomLevel = "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";

type QuestSession = {
  id: string;
  deckId: string;
  levels: BloomLevel[];
  currentLevel: BloomLevel;
  currentIndex: number;
  progressByLevel: Record<BloomLevel, string[]>;
  completedLevels: BloomLevel[];
  totalCards: number;
  deckTitle?: string;
};

const isQuestSession = (v: any): v is QuestSession =>
  v &&
  Array.isArray(v.levels) &&
  Array.isArray(v.completedLevels) &&
  typeof v.currentIndex === "number" &&
  v.progressByLevel;


export default function QuestPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useUserAuth();
  const [session, setSession] = useState<any>(null);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [globalProgress, setGlobalProgress] = useState<GlobalProgress | null>(null);

  const fetchSession = useCallback(async () => {
    if (!user?.uid || !deckId) return;
    setLoading(true);
    try {
      const { global } = await getUserProgress(user.uid);
      setGlobalProgress(global);
      const s = await getOrCreateQuestSession({
        uid: user.uid,
        deckId,
        fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
      });
      
      if (!isQuestSession(s)) {
          setLoading(false);
          toast({ title: "Error", description: "Could not load quest session data.", variant: "destructive" });
          return;
      }

      if (s.completedLevels.length === s.levels.length && s.levels.length > 0) {
         setSession(s);
         setCurrentCard(null); // No more cards
         setLoading(false);
         return;
      }

      await ensureLevelOrder({
        uid: user.uid,
        deckId,
        level: s.currentLevel as BloomLevel,
        fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
      });
      
      const updatedSession = await getOrCreateQuestSession({
          uid: user.uid,
          deckId,
          fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
      });
      
      if (!isQuestSession(updatedSession)) {
          setLoading(false);
          return;
      }

      const order = updatedSession.progressByLevel[updatedSession.currentLevel] ?? [];
      const cardId = order[updatedSession.currentIndex];
      const card = cardId ? await getCardById(user.uid, deckId, cardId) : null;

      setSession(updatedSession);
      setCurrentCard(card);
    } catch (error) {
      console.error("Error setting up quest session:", error);
      toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load your Quest session. Please try again."
      });
      router.push(`/decks/${deckId}/study`);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, deckId, toast, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const percentOverall = useMemo(() => {
    if (!isQuestSession(session) || !session?.totalCards || session.totalCards === 0) return 0;
    const doneBefore = (session.completedLevels || []).reduce((acc: number, lvl: BloomLevel) => acc + (session.progressByLevel?.[lvl]?.length || 0), 0);
    const doneInLevel = session?.currentIndex || 0;
    return Math.floor(100 * (doneBefore + doneInLevel) / session.totalCards);
  }, [session]);
  
  const handleNextCard = useCallback(async () => {
    if (!user?.uid || !session) return;
    setChecking(true);
    
    await advance({ uid: user.uid, deckId });

    // Refetch the session to get the new state
    const s = await getOrCreateQuestSession({
      uid: user.uid,
      deckId,
      fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
    });
    
    if (!isQuestSession(s)) {
      setChecking(false);
      return;
    }

    if (s.completedLevels.length === s.levels.length && s.levels.length > 0) {
        setSession(s);
        setCurrentCard(null);
        setChecking(false);
        return;
    }

    await ensureLevelOrder({
      uid: user.uid,
      deckId,
      level: s.currentLevel as BloomLevel,
      fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
    });
    
     const updatedSession = await getOrCreateQuestSession({
        uid: user.uid,
        deckId,
        fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
     });
    
    if (!isQuestSession(updatedSession)) {
        setChecking(false);
        return;
    }

    const order = updatedSession.progressByLevel[updatedSession.currentLevel] ?? [];
    const cardId = order[updatedSession.currentIndex];
    const card = cardId ? await getCardById(user.uid, deckId, cardId) : null;
    
    setSession(updatedSession);
    setCurrentCard(card);
    setChecking(false);
  }, [user, session, deckId]);


  const handleRestart = async () => {
    if (!user?.uid || !deckId) return;
    setLoading(true);
    const sessionRef = doc(db, "users", user.uid, "questSessions", deckId);
    await deleteDoc(sessionRef);
    fetchSession(); // This will re-create the session
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentCard || !isQuestSession(session)) {
     return (
        <MissionComplete
            modeName="Quest"
            deckName={session?.deckTitle || "Deck"}
            xp={150} // Placeholder
            coins={75} // Placeholder
            accuracy={92} // Placeholder
            questionsAnswered={isQuestSession(session) ? session.totalCards : 0}
            onReturnHQ={() => router.push('/dashboard')}
            onRestartMission={handleRestart}
            globalProgress={globalProgress}
        />
    )
  }

  return (
    <StudyMissionLayout
        deckTitle={session?.deckTitle || "Quest"}
        progress={percentOverall}
        tokens={0}
        powerUpsExpanded={false}
        setPowerUpsExpanded={() => {}}
        onUsePowerUp={() => {}}
        purchaseCounts={{}}
        currentLevelName={isQuestSession(session) ? session.currentLevel : ''}
        cardsLeftInLevel={isQuestSession(session) ? (session.progressByLevel?.[session.currentLevel]?.length || 0) - session.currentIndex : 0}
    >
       <main className="w-full">
         <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <StudyCard
                card={currentCard}
                onLogAttempt={(card, wasCorrect) => {
                    if (user) {
                        logCardAttempt(user.uid, {
                            deckId: deckId,
                            cardId: String(card.id),
                            bloomLevel: card.bloomLevel,
                            wasCorrect: wasCorrect,
                            timestamp: new Date()
                        });
                    }
                }}
                onNextCard={handleNextCard}
                deckId={deckId}
                isRetryArmed={false} // TODO: Implement power-ups
                onUseRetry={() => {}}
            />
        </motion.div>
       </main>
    </StudyMissionLayout>
  );
}
