
'use client';

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTopics, logCardAttempt, purchasePowerUp, getDeckPurchaseCounts, saveUserDeckProgress, getUserDeckProgress, getUserXpStats } from "@/lib/firestore";
import type { Deck, Flashcard, StandardMCQCard, UserPowerUps, PowerUpType, PurchaseCounts, UserDeckProgress, UserXpStats, Topic } from "@/stitch/types";
import { useUserAuth } from "@/app/Providers/AuthProvider";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudyMissionLayout } from "@/components/StudyMissionLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StudyCard } from "@/components/StudyCard";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserSettings } from "@/hooks/useUserSettings";


// 🔁 Shuffle helper
function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const MISSION_LENGTH = 10;

export default function RemixStudyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { deckId } = params as { deckId: string };
  const { user } = useUserAuth();
  const { toast } = useToast();
  const { settings } = useUserSettings();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [sessionOrder, setSessionOrder] = useState<string[]>([]);
  
  const [index, setIndex] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [purchaseCounts, setPurchaseCounts] = useState<PurchaseCounts>({ 'hint': 0, 'retry': 0, 'fifty-fifty': 0, 'time': 0, 'focus': 0, 'unlock': 0 });
  const [loading, setLoading] = useState(true);
  const [powerUpsExpanded, setPowerUpsExpanded] = useState(false);
  const [isRetryArmed, setIsRetryArmed] = useState(false);
  const [deckProgress, setDeckProgress] = useState<UserDeckProgress | null>(null);
  const [xpStats, setXpStats] = useState<UserXpStats | null>(null);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);

  // Checkpoint state
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  
  const proceedToCard = useCallback((newIndex: number) => {
    setDisabledOptions([]);
    setIndex(newIndex);
    if(user && deck) {
        saveUserDeckProgress(user.uid, deck.id, {
          lastCardIndex: newIndex,
          mode: 'remix',
          randomOrder: sessionOrder,
        } as Partial<UserDeckProgress>);
    }
  }, [user, deck, sessionOrder]);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    const fetchDeckData = async () => {
        setLoading(true);
        try {
            const [topics, progress, stats, counts] = await Promise.all([
                getTopics(user.uid),
                getUserDeckProgress(user.uid, deckId),
                getUserXpStats(user.uid),
                getDeckPurchaseCounts(user.uid, deckId)
            ]);
            
            const userDeckProgress = progress as UserDeckProgress | null;
            setDeckProgress(userDeckProgress);
            setXpStats(stats);
            setPurchaseCounts(counts);

            const foundDeck = topics.flatMap((t: Topic) => t.decks).find((d: Deck) => d.id === deckId);
            
            if (foundDeck) {
                setDeck(foundDeck);
                
                const isNewRemix = searchParams.get('new') === 'true';

                let initialIndex = 0;
                let cardsForSession: Flashcard[] = [];

                if (userDeckProgress?.randomOrder?.length && userDeckProgress.mode === 'remix' && !isNewRemix) {
                    // Resume existing remix session
                    const cardOrder = userDeckProgress.randomOrder!;
                    setSessionOrder(cardOrder);
                    cardsForSession = cardOrder
                      .map((id: string) => foundDeck.cards.find((c: Flashcard) => String(c.id) === id))
                      .filter(Boolean) as Flashcard[];
                    initialIndex = userDeckProgress.lastCardIndex || 0;
                    if (userDeckProgress.streak === 0) {
                      userDeckProgress.streak = 0;
                    }
                    toast({ title: "Welcome Back!", description: `Resuming your remix mission.` });
                } else {
                    if (userDeckProgress) userDeckProgress.streak = 0;
                    // Start new remix session
                    const shuffledAll = shuffleArray(foundDeck.cards);
                    const missionCards: Flashcard[] = shuffledAll.slice(0, MISSION_LENGTH);
                    const newCardOrder = missionCards.map((c: Flashcard) => String(c.id));
                    setSessionOrder(newCardOrder);
                    cardsForSession = missionCards as Flashcard[];
                    if(user) {
                      await saveUserDeckProgress(user.uid, deckId, {
                        lastCardIndex: 0,
                        mode: 'remix',
                        randomOrder: newCardOrder,
                        streak: 0
                      } as Partial<UserDeckProgress>);
                    }
                }
                setStudyCards(cardsForSession);
                setIndex(initialIndex);

            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Deck not found.'});
                router.push('/decks');
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load deck data.'});
        } finally {
            setLoading(false);
        }
    }
    
    fetchDeckData();

  }, [deckId, user, router, toast, searchParams]);

  const handleLogAttempt = (card: Flashcard, wasCorrect: boolean) => {
    if(user && deck) {
        logCardAttempt(user.uid, { 
            deckId: deck.id, 
            cardId: String(card.id),
            wasCorrect: wasCorrect,
            bloomLevel: card.bloomLevel,
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
    }
  }

  const proceedToNextCard = useCallback(() => {
    const newIndex = index + 1;
    if (newIndex >= studyCards.length) {
      setIsSessionComplete(true);
      if(user && deck) {
          saveUserDeckProgress(user.uid, deck.id, {
            lastCardIndex: 0,
            mode: 'remix',
            randomOrder: []
          } as Partial<UserDeckProgress>);
      }
      return;
    }
    proceedToCard(newIndex);
  }, [index, studyCards.length, user, deck, proceedToCard]);

  const nextCard = useCallback(() => {
    const nextIndex = index + 1;
    // Check for checkpoint every 3 cards, but not on the last card
    if (nextIndex > 0 && nextIndex % 3 === 0 && nextIndex < studyCards.length) {
      setShowCheckpoint(true);
    } else {
      proceedToNextCard();
    }
  }, [index, studyCards.length, proceedToNextCard]);

  const handlePowerUpUse = async (type: PowerUpType, cost: number) => {
    if (!user || !deck) return;
    try {
        await purchasePowerUp(user.uid, deck.id, type, cost);
        if (type === 'retry') {
            setIsRetryArmed(true);
        }
        if (type === 'fifty-fifty') {
            const card = studyCards[index] as StandardMCQCard;
            if (card.cardFormat === 'Standard MCQ') {
                 const wrongIndices = card.tier1.options
                    .map((_, i) => i)
                    .filter(i => i !== card.tier1.correctAnswerIndex);
                 setDisabledOptions(shuffleArray(wrongIndices).slice(0, 2));
            }
        }
        toast({ title: 'Power-Up Used!', description: `Spent ${cost} tokens.`});
        setPurchaseCounts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1}));
    } catch(e: any) {
        toast({ variant: 'destructive', title: `Could not use ${type}`, description: e.message });
    }
  };

  if (loading) {
     return <div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }
  
  const currentCard = studyCards[index];

  if (isSessionComplete) {
      return (
         <Card className="p-8 text-center">
                <CardHeader>
                    <PartyPopper className="h-16 w-16 text-primary mx-auto" />
                    <CardTitle className="text-3xl font-bold mt-4">🎉 Mission Complete!</CardTitle>
                </CardHeader>
                 <CardContent>
                    <p className="text-muted-foreground my-6">You've completed this remix session.</p>
                    <Button onClick={() => router.push(`/decks/${deckId}/study`)}>Back to Missions</Button>
                </CardContent>
            </Card>
      )
  }
  
  if (!currentCard) {
      return (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">No cards to study in this mission.</p>
            <Button onClick={() => router.push(`/decks/${deckId}/study`)} className="mt-4">Back to Missions</Button>
          </div>
      )
  }
  
  const progress = Math.round(((index + 1) / studyCards.length) * 100);

  return (
    <StudyMissionLayout
        deckTitle={deck?.title || ''}
        deckLevel={deckProgress?.level}
        progress={progress}
        tokens={settings?.tokens || 0}
        powerUpsExpanded={powerUpsExpanded}
        setPowerUpsExpanded={setPowerUpsExpanded}
        onUsePowerUp={handlePowerUpUse}
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
                    <AlertDialogCancel onClick={() => router.push(`/decks/${deckId}/study`)}>Back to Missions</AlertDialogCancel>
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
                        onNextCard={nextCard}
                        deckId={deckId}
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
