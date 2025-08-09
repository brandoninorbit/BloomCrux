'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Target, Check, PartyPopper } from 'lucide-react';
import type { Deck, CardAttempt, BloomLevel, Flashcard, UserPowerUps, PowerUpType, PurchaseCounts, UserDeckProgress, UserXpStats, StandardMCQCard } from '@/stitch/types';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import { getTopics, getDeckProgress, logCardAttempt, purchasePowerUp, getDeckPurchaseCounts, getUserDeckProgress, getUserXpStats } from '@/lib/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
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

const WEAKNESS_THRESHOLD = 0.8; // 80%

function StudySession({ cards, deck, onExit, initialDeckProgress, isXpBoosted }: { cards: Flashcard[], deck: Deck, onExit: () => void, initialDeckProgress: UserDeckProgress | null, isXpBoosted?: boolean }) {
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
                <CardTitle className="text-2xl font-bold mt-4">No Practice Cards</CardTitle>
                <CardContent>
                    <p className="text-muted-foreground my-6">No standard MCQ cards were found in your weak areas to practice.</p>
                    <Button onClick={onExit}>Back to Target Practice</Button>
                </CardContent>
            </Card>
        );
    }
    
    if (isSessionComplete) {
        return (
            <Card className="p-8 text-center">
                <PartyPopper className="h-16 w-16 text-primary mx-auto" />
                <CardTitle className="text-3xl font-bold mt-4">Practice Complete!</CardTitle>
                <CardContent>
                    <p className="text-muted-foreground my-6">You've reviewed all your weak cards for this session.</p>
                    <Button onClick={onExit}>Back to Target Practice</Button>
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
                    >
                         <StudyCard
                            card={currentCard}
                            onLogAttempt={handleLogAttempt}
                            onNextCard={goToNextCard}
                            deckId={String(deck.id)}
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


export default function PracticePage() {
    const { deckId } = useParams() as { deckId: string };
    const { user } = useUserAuth();
    const router = useRouter();

    const [deck, setDeck] = useState<Deck | null>(null);
    const [weakCards, setWeakCards] = useState<Flashcard[]>([]);
    const [bloomLevels, setBloomLevels] = useState<Record<BloomLevel, { correct: number, total: number }>>({} as any);
    const [isLoading, setIsLoading] = useState(true);
    const [isPracticing, setIsPracticing] = useState(false);
    const [deckProgress, setDeckProgress] = useState<UserDeckProgress | null>(null);
    const [xpStats, setXpStats] = useState<UserXpStats | null>(null);

    const fetchPracticeData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        const [topics, attempts, progress, stats] = await Promise.all([
            getTopics(user.uid),
            getDeckProgress(user.uid),
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
        
        const deckAttempts = attempts.filter(a => a.deckId === deckId);
        
        const levels: Record<string, { correct: number, total: number }> = {};
        deckAttempts.forEach(attempt => {
            if (!levels[attempt.bloomLevel]) levels[attempt.bloomLevel] = { correct: 0, total: 0 };
            levels[attempt.bloomLevel].total++;
            if (attempt.wasCorrect) levels[attempt.bloomLevel].correct++;
        });
        setBloomLevels(levels as any);

        const weakLevels = new Set(Object.entries(levels)
            .filter(([_, data]) => data.total > 0 && (data.correct / data.total) < WEAKNESS_THRESHOLD)
            .map(([level, _]) => level)
        );

        const cardsToPractice = foundDeck.cards.filter(c => weakLevels.has(c.bloomLevel));
        setWeakCards(cardsToPractice);
        setIsLoading(false);
    }, [user, deckId, router]);


    useEffect(() => {
        fetchPracticeData();
    }, [fetchPracticeData]);
    
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (isPracticing && deck) {
        return <StudySession 
            cards={weakCards} 
            deck={deck} 
            onExit={() => { setIsPracticing(false); fetchPracticeData(); }} 
            initialDeckProgress={deckProgress}
            isXpBoosted={xpStats?.isXpBoosted}
        />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target />
                    Target Practice
                </CardTitle>
            </CardHeader>
            <CardContent>
                {weakCards.length > 0 ? (
                    <div className="space-y-6">
                        <p className="text-muted-foreground text-center">Focus on the cards from levels where you're scoring below {WEAKNESS_THRESHOLD * 100}%.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {weakCards.map((card, i) => {
                                const levelData = bloomLevels[card.bloomLevel];
                                const accuracy = levelData ? Math.floor((levelData.correct / levelData.total) * 100) : 0;
                                return (
                                <motion.div
                                    key={card.id}
                                    className="p-4 bg-card rounded-lg shadow border"
                                    animate={{ scale: [1, 1.02, 1] }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                                >
                                    <p className="font-semibold truncate">{card.questionStem}</p>
                                    <div className="text-sm text-red-500 font-medium">
                                        <span>{card.bloomLevel} Level</span> ({accuracy}% correct)
                                    </div>
                                </motion.div>
                            )})}
                        </div>
                         <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center pt-4"
                        >
                            <Button size="lg" onClick={() => setIsPracticing(true)}>
                                Practice All ({weakCards.length})
                            </Button>
                        </motion.div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center h-64">
                        <Check className="h-16 w-16 text-green-500 bg-green-100 rounded-full p-2 mb-4" />
                        <p className="text-lg font-semibold">No Weak Cards Found!</p>
                        <p className="text-muted-foreground">You're doing great! All your practiced levels are above {WEAKNESS_THRESHOLD * 100}% mastery.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
