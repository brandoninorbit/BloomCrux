'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type {
  Flashcard,
  StandardMCQCard,
  Deck,
  UserPowerUps,
  PowerUpType,
  PurchaseCounts,
  DeckProgress,
  UserXpStats,
} from '@/stitch/types';
import {
  Loader2,
  PartyPopper,
  Timer,
} from 'lucide-react';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import {
  getTopics,
  logCardAttempt,
  getDeckPurchaseCounts,
  purchasePowerUp,
  getUserDeckProgress,
  getUserXpStats,
} from '@/lib/firestore';
import Link from 'next/link';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { StudyMissionLayout } from '@/components/StudyMissionLayout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { StudyCard } from '@/components/StudyCard';
import { useUserSettings } from '@/hooks/useUserSettings';


const TIMER_DURATION = 15; // 15 seconds per card

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function TimedDrillPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUserAuth();
  const { settings } = useUserSettings();
  const { deckId } = params as { deckId: string };

  const [deck, setDeck] = useState<Deck | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  const timePerCard = settings?.studyDefaults.timedDrill.defaultTime ?? TIMER_DURATION;
  const autoAdvance = settings?.studyDefaults.timedDrill.autoAdvance ?? true;

  const [timeLeft, setTimeLeft] = useState(timePerCard);
  const [purchaseCounts, setPurchaseCounts] = useState<PurchaseCounts>({ 'hint': 0, 'retry': 0, 'fifty-fifty': 0, 'time': 0, 'focus': 0, 'unlock': 0 });
  const [powerUpsExpanded, setPowerUpsExpanded] = useState(false);
  const [isRetryArmed, setIsRetryArmed] = useState(false);
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);
  const [xpStats, setXpStats] = useState<UserXpStats | null>(null);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);

  // Checkpoint state
  const [showCheckpoint, setShowCheckpoint] = useState(false);

  const animationControls = useAnimation();
  const currentCard = studyCards[currentCardIndex] as StandardMCQCard;
  const [isAnswered, setIsAnswered] = useState(false);

  const resetCardState = useCallback(() => {
    setTimeLeft(timePerCard);
    setIsAnswered(false);
    setDisabledOptions([]);
  }, [timePerCard]);

  const proceedToNextCard = useCallback(() => {
    animationControls.start({ x: 0 }); // Reset shake animation
    const newIndex = currentCardIndex + 1;
    if (newIndex >= studyCards.length) {
      setIsSessionComplete(true);
      setIsSessionActive(false);
      return;
    }
    setCurrentCardIndex(newIndex);
    resetCardState();
  }, [currentCardIndex, studyCards.length, resetCardState, animationControls]);


  const goToNextCard = useCallback(() => {
    const nextIndex = currentCardIndex + 1;
    if (nextIndex > 0 && nextIndex % 3 === 0 && nextIndex < studyCards.length) {
        setShowCheckpoint(true);
    } else {
        proceedToNextCard();
    }
  }, [currentCardIndex, studyCards.length, proceedToNextCard]);

  useEffect(() => {
    const setup = async () => {
      if (!user) return;
      const topics = await getTopics(user.uid);
      const foundDeck = topics.flatMap(t => t.decks).find(d => d.id === deckId);
      if (foundDeck) {
        setDeck(foundDeck);
        setStudyCards(shuffleArray(foundDeck.cards));
      } else {
        toast({ variant: 'destructive', title: 'Deck not found' });
        router.push('/decks');
      }
      const [counts, progress, stats] = await Promise.all([
          getDeckPurchaseCounts(user.uid, deckId),
          getUserDeckProgress(user.uid, deckId),
          getUserXpStats(user.uid)
      ]);
      setPurchaseCounts(counts);
      setDeckProgress(progress as any);
      setXpStats(stats);
      setLoading(false);
    };
    setup();
  }, [user, deckId, router, toast]);

  useEffect(() => {
    if (!isSessionActive || isAnswered) return;

    if (timeLeft === 0) {
      animationControls.start({ x: [0, -8, 8, -8, 8, 0] }, { duration: 0.4 });
      if (currentCard) {
        handleLogAttempt(currentCard, false); // Timeout counts as incorrect
      }
      setIsAnswered(true); // Mark as answered to show feedback
      if(autoAdvance) {
        setTimeout(goToNextCard, 1500); // Give time for feedback
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [isSessionActive, timeLeft, isAnswered, goToNextCard, animationControls, currentCard, autoAdvance]);

  const handleLogAttempt = (card: Flashcard, wasCorrect: boolean) => {
    if (!user) return;
    setIsAnswered(true);

    if (!wasCorrect && isRetryArmed) {
        setIsRetryArmed(false);
        toast({ title: "Retry Used!", description: "Your streak is safe. Try again!" });
        resetCardState();
        return;
    }

    logCardAttempt({
      userId: user.uid,
      deckId: deckId,
      cardId: card.id,
      bloomLevel: card.bloomLevel,
      wasCorrect: wasCorrect,
      timestamp: new Date(),
    }).then(({ xpBreakdown }) => {
        if (wasCorrect) {
            let xpMessage = `+${xpBreakdown.base} XP (${card.bloomLevel})`;
            if (xpBreakdown.streakBonus > 0) xpMessage += ` • +${xpBreakdown.streakBonus} XP (Streak)`;
            if (xpBreakdown.weakCardBonus > 0) xpMessage += ` • +${xpBreakdown.weakCardBonus} XP (Weak Card)`;
            if (xpBreakdown.recencyBonus < 0) xpMessage += ` • ${xpBreakdown.recencyBonus} XP (Recency)`;
            toast({ title: 'Correct!', description: xpMessage });
        }
    });
  };

  const handleUsePowerUp = async (type: PowerUpType, cost: number) => {
      if (!user || !deck) return;
      try {
        await purchasePowerUp(user.uid, deckId, type, cost);
        if (type === 'time') {
          setTimeLeft(prev => prev + 15);
        }
        if (type === 'retry') {
            setIsRetryArmed(true);
        }
        if (type === 'fifty-fifty') {
            const card = currentCard as StandardMCQCard;
            if (card.cardFormat === 'Standard MCQ') {
                 const wrongIndices = card.tier1.options
                    .map((_, i) => i)
                    .filter(i => i !== card.tier1.correctAnswerIndex);
                 setDisabledOptions(shuffleArray(wrongIndices).slice(0, 2));
            }
        }
        toast({ title: 'Power-Up Used!', description: `Spent ${cost} tokens.`});
        setPurchaseCounts(prev => ({...prev, [type]: (prev[type] || 0) + 1}));
      } catch(e: any) {
        toast({ variant: 'destructive', title: `Could not use ${type}`, description: e.message });
      }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!isSessionActive || !deck) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Timer /> Timed Drill</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center h-64">
                <p className="text-lg font-semibold">Ready for a challenge?</p>
                <p className="text-muted-foreground">Answer as many cards as you can before the timer runs out for each one.</p>
                <Button className="mt-6" size="lg" onClick={() => setIsSessionActive(true)}>Start Timed Drill</Button>
            </CardContent>
        </Card>
    )
  }

  if (isSessionComplete) {
     return (
       <Card className="p-8 text-center">
          <PartyPopper className="h-16 w-16 text-primary mx-auto" />
          <CardTitle className="text-3xl font-bold mt-4">Drill Complete!</CardTitle>
          <CardContent>
              <p className="text-muted-foreground my-6">You've finished the timed drill.</p>
              <div className="flex justify-center gap-4">
                  <Button onClick={() => {
                    setStudyCards(shuffleArray(deck.cards));
                    setCurrentCardIndex(0);
                    setIsSessionComplete(false);
                    setIsSessionActive(true);
                    resetCardState();
                  }}>Try Again</Button>
                  <Button asChild variant="secondary">
                      <Link href={`/decks/${deckId}/study`}>Change Mode</Link>
                  </Button>
              </div>
          </CardContent>
       </Card>
    )
  }

  const progress = ((currentCardIndex + 1) / studyCards.length) * 100;

  return (
    <StudyMissionLayout
      deckTitle={`Timed: ${deck.title}`}
      deckLevel={deckProgress?.level}
      progress={progress}
      tokens={settings?.tokens || 0}
      powerUpsExpanded={powerUpsExpanded}
      setPowerUpsExpanded={setPowerUpsExpanded}
      onUsePowerUp={handleUsePowerUp}
      purchaseCounts={purchaseCounts}
      timerValue={timeLeft}
      timerMaxValue={timePerCard}
    >
       <AlertDialog open={showCheckpoint} onOpenChange={setShowCheckpoint}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Checkpoint Reached!</AlertDialogTitle>
                    <AlertDialogDescription>
                        You're doing great! Take a short break or continue your session.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => router.push(`/decks/${deck.id}/study`)}>Back to Missions</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        setShowCheckpoint(false);
                        proceedToNextCard();
                    }}>
                        Continue Session
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <main className="w-full">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentCard.id}
                    initial={{ opacity: 0, y: 20, rotateY: -90 }}
                    animate={{ opacity: 1, y: 0, rotateY: 0 }}
                    exit={{ opacity: 0, y: -20, rotateY: 90 }}
                    transition={{ duration: 0.4 }}
                    custom={animationControls}
                >
                    <StudyCard
                        card={currentCard}
                        onLogAttempt={handleLogAttempt}
                        onNextCard={goToNextCard}
                        deckId={deckId}
                        isAnswered={isAnswered}
                        isRetryArmed={isRetryArmed}
                        onUseRetry={() => setIsRetryArmed(false)}
                        isXpBoosted={xpStats?.isXpBoosted}
                        disabledOptions={disabledOptions}
                    />
                </motion.div>
            </AnimatePresence>
        </main>
    </StudyMissionLayout>
  );
}
