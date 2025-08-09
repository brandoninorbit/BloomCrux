
'use client';
export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Flashcard, StandardMCQCard, CompareContrastCard, DragAndDropSortingCard, FillInTheBlankCard, ShortAnswerCard, TwoTierMCQCard, CERCard, SequencingCard, Topic, Deck, StudyMode, DeckProgress, BloomLevel, UserPowerUps, PowerUpType, PurchaseCounts, CardFormat, UserXpStats, UserSettings } from '@/stitch/types';
import { Loader2, ArrowLeft, ArrowRight, Check, X, PartyPopper, Lightbulb, History, SkipForward, ShieldAlert, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import { getDeck, logCardAttempt, getUserDeckProgress, saveUserDeckProgress, getDeckPurchaseCounts, purchasePowerUp, getUserXpStats, getCardsForDeckByBloomLevel, getCardById } from '@/lib/firestore';
import { getDb } from '@/lib/firebase';
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
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useUserSettings } from '@/hooks/useUserSettings';
import { getOrCreateQuestSession, ensureLevelOrder, advance } from "@/lib/quest";


export default function QuestPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useUserAuth();
  const [session, setSession] = useState<any>(null);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.uid || !deckId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const s = await getOrCreateQuestSession({
          uid: user.uid,
          deckId,
          fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
        });
        
        if (s.completedLevels.length === s.levels.length) {
          if (!cancelled) {
             setSession(s);
             setCurrentCard(null); // No more cards
             setLoading(false);
          }
          return;
        }

        await ensureLevelOrder({
          uid: user.uid,
          deckId,
          level: s.currentLevel as BloomLevel,
          fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
        });
        
        // Re-fetch session data after ensuring level order to get the updated totalCards
        const updatedSession = await getOrCreateQuestSession({
            uid: user.uid,
            deckId,
            fetchCardsByLevel: (lvl) => getCardsForDeckByBloomLevel(user.uid, deckId, lvl)
        });

        const order = updatedSession.progressByLevel[updatedSession.currentLevel] as string[];
        const cardId = order[updatedSession.currentIndex];
        const card = cardId ? await getCardById(user.uid, deckId, cardId) : null;

        if (!cancelled) {
          setSession(updatedSession);
          setCurrentCard(card);
        }
      } catch (error) {
        console.error("Error setting up quest session:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load your Quest session. Please try again."
        });
        router.push(`/decks/${deckId}/study`);
      } finally {
        if (!cancelled) {
            setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [user?.uid, deckId, toast, router]);

  const percentOverall = useMemo(() => {
    if (!session?.totalCards || session.totalCards === 0) return 0;
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
    
    if (s.completedLevels.length === s.levels.length) {
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

    const order = updatedSession.progressByLevel[updatedSession.currentLevel] as string[];
    const cardId = order[updatedSession.currentIndex];
    const card = cardId ? await getCardById(user.uid, deckId, cardId) : null;
    
    setSession(updatedSession);
    setCurrentCard(card);
    setChecking(false);
  }, [user, session, deckId]);


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentCard) {
     return (
       <main className="container mx-auto max-w-2xl p-4 py-8 text-center">
         <Card className="p-8">
            <CardHeader>
                <PartyPopper className="h-16 w-16 text-primary mx-auto" />
                <CardTitle className="text-3xl font-bold mt-4">Quest Complete!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">You've mastered all levels in this deck. Outstanding work, Agent.</p>
                <div className="flex justify-center gap-4">
                    <Button asChild>
                        <Link href="/dashboard">View Progress</Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href={`/decks/${deckId}/study`}>Back to Missions</Link>
                    </Button>
                </div>
            </CardContent>
         </Card>
       </main>
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
        currentLevelName={session.currentLevel}
        cardsLeftInLevel={(session.progressByLevel?.[session.currentLevel]?.length || 0) - session.currentIndex}
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
