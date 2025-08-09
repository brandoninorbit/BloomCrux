'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type {
  Flashcard,
  StandardMCQCard,
  Deck,
  UserPowerUps,
  PowerUpType,
  PurchaseCounts,
  UserDeckProgress,
  UserXpStats,
} from '@/stitch/types';
import {
  Loader2,
  PartyPopper,
  Star,
} from 'lucide-react';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import {
  getTopics,
  logCardAttempt,
  purchasePowerUp,
  getDeckPurchaseCounts,
  getUserDeckProgress,
  getUserXpStats,
} from '@/lib/firestore';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyMissionLayout } from '@/components/StudyMissionLayout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { StudyCard } from '@/components/StudyCard';
import { useUserSettings } from '@/hooks/useUserSettings';


const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


function StarredStudySession({ cards, deck, onExit, initialDeckProgress, isXpBoosted }: { cards: Flashcard[], deck: Deck, onExit: () => void, initialDeckProgress: UserDeckProgress | null, isXpBoosted?: boolean }) {
    const [studyCards, setStudyCards] = useState<Flashcard[]>(() => shuffleArray(cards));
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isSessionComplete, setIsSessionComplete] = useState(false);

    // Power-ups
    const [powerUpsExpanded, setPowerUpsExpanded] = useState(false);
    const { settings } = useUserSettings();
    const [purchaseCounts, setPurchaseCounts] = useState<PurchaseCounts>({ 'hint': 0, 'retry': 0, 'fifty-fifty': 0, 'time': 0, 'focus': 0, 'unlock': 0 });
    const [isRetryArmed, setIsRetryArmed] = useState(false);
    const [disabledOptions, setDisabledOptions] = useState<number[]>([]);

    const { user } = useUserAuth();
    const router = useRouter();
    const { toast } = useToast();

    // Checkpoint state
    const [showCheckpoint, setShowCheckpoint] = useState(false);

    const currentCard = studyCards[currentCardIndex];

    useEffect(() => {
        if (!user) return;
        getDeckPurchaseCounts(user.uid, deck.id).then(setPurchaseCounts);
    }, [user, deck.id]);

    const proceedToNextCard = useCallback(() => {
      setDisabledOptions([]);
      const newIndex = currentCardIndex + 1;
      if (newIndex >= studyCards.length) {
          setIsSessionComplete(true);
          return;
      }
      setCurrentCardIndex(newIndex);
    }, [currentCardIndex, studyCards.length]);

    const goToNextCard = useCallback(() => {
        const nextIndex = currentCardIndex + 1;
        // Check for checkpoint every 3 cards, but not on the last card
        if (nextIndex > 0 && nextIndex % 3 === 0 && nextIndex < studyCards.length) {
            setShowCheckpoint(true);
        } else {
            proceedToNextCard();
        }
    }, [currentCardIndex, studyCards.length, proceedToNextCard]);

    const handleLogAttempt = (card: Flashcard, wasCorrect: boolean) => {
        if (!user) return;

        logCardAttempt({ userId: user.uid, deckId: deck.id, cardId: card.id, bloomLevel: card.bloomLevel, wasCorrect, timestamp: new Date() }).then(({ xpBreakdown }) => {
            if (wasCorrect) {
                let xpMessage = `+${xpBreakdown.base} XP (${card.bloomLevel})`;
                if (xpBreakdown.streakBonus > 0) xpMessage += ` • +${xpBreakdown.streakBonus} XP (Streak)`;
                if (xpBreakdown.weakCardBonus > 0) xpMessage += ` • +${xpBreakdown.weakCardBonus} XP (Weak Card)`;
                if (xpBreakdown.recencyBonus < 0) xpMessage += ` • ${xpBreakdown.recencyBonus} XP (Recency)`;
                toast({ title: 'Correct!', description: xpMessage });
            }
        });
    }

    const handleUsePowerUp = async (type: PowerUpType, cost: number) => {
      if (!user) return;
      try {
        await purchasePowerUp(user.uid, deck.id, type, cost);
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
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Could not use power-up', description: e.message });
      }
    };

     if (!currentCard || studyCards.length === 0) {
        return (
            <Card className="p-8 text-center">
                <CardTitle className="text-2xl font-bold mt-4">No Starred Cards</CardTitle>
                <CardContent>
                    <p className="text-muted-foreground my-6">No standard MCQ cards were found in your starred items to study.</p>
                    <Button onClick={onExit}>Back to Study Options</Button>
                </CardContent>
            </Card>
        );
    }

    if (isSessionComplete) {
        return (
            <Card className="p-8 text-center">
                <PartyPopper className="h-16 w-16 text-primary mx-auto" />
                <CardTitle className="text-3xl font-bold mt-4">Review Complete!</CardTitle>
                <CardContent>
                    <p className="text-muted-foreground my-6">You've reviewed all your starred cards.</p>
                    <Button onClick={onExit}>Back to Study Options</Button>
                </CardContent>
            </Card>
        );
    }

    const progress = Math.round(((currentCardIndex + 1) / studyCards.length) * 100);

    return (
       <StudyMissionLayout
            deckTitle={deck.title}
            deckLevel={initialDeckProgress?.level}
            progress={progress}
            tokens={settings?.tokens || 0}
            powerUpsExpanded={powerUpsExpanded}
            setPowerUpsExpanded={setPowerUpsExpanded}
            onUsePowerUp={handleUsePowerUp}
            purchaseCounts={purchaseCounts}
       >
           <AlertDialog open={showCheckpoint} onOpenChange={setShowCheckpoint}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Checkpoint Reached!</AlertDialogTitle>
                        <AlertDialogDescription>
                            You're getting the hang of this! Take a short break or continue your session.
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
                    >
                        <StudyCard
                            card={currentCard}
                            onLogAttempt={handleLogAttempt}
                            onNextCard={goToNextCard}
                            deckId={deck.id}
                            isRetryArmed={isRetryArmed}
                            onUseRetry={() => setIsRetryArmed(false)}
                            isXpBoosted={isXpBoosted}
                            disabledOptions={disabledOptions}
                        />
                    </motion.div>
                </AnimatePresence>
            </main>
       </StudyMissionLayout>
    );
}


export default function StarredPage() {
    const { deckId } = useParams() as { deckId: string };
    const { user } = useUserAuth();
    const router = useRouter();

    const [deck, setDeck] = useState<Deck | null>(null);
    const [starredCards, setStarredCards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deckProgress, setDeckProgress] = useState<UserDeckProgress | null>(null);
    const [xpStats, setXpStats] = useState<UserXpStats | null>(null);

    useEffect(() => {
        const fetchStarredData = async () => {
            if (!user) return;
            setIsLoading(true);

            const [topics, progress, stats] = await Promise.all([
                getTopics(user.uid),
                getUserDeckProgress(user.uid, deckId),
                getUserXpStats(user.uid)
            ]);

            setDeckProgress(progress);
            setXpStats(stats);
            const foundDeck = topics.flatMap(t => t.decks).find(d => d.id === deckId);

            if (!foundDeck) {
                router.push('/decks');
                return;
            }
            setDeck(foundDeck);
            setStarredCards(foundDeck.cards.filter(c => c.isStarred));
            setIsLoading(false);
        };
        fetchStarredData();
    }, [user, deckId, router]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (starredCards.length === 0 || !deck) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star />
                        Starred Cards
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center h-64">
                    <p className="text-lg font-semibold">No Starred Cards</p>
                    <p className="text-muted-foreground">You haven't starred any cards in this deck yet.</p>
                    <Button asChild variant="secondary" className="mt-4">
                        <Link href={`/decks/${deckId}/edit`}>Go to Deck</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return <StarredStudySession
        cards={starredCards}
        deck={deck}
        onExit={() => router.push(`/decks/${deckId}/study`)}
        initialDeckProgress={deckProgress}
        isXpBoosted={xpStats?.isXpBoosted}
    />;
}
