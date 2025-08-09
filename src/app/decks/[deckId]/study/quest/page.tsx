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
import { getDeck, logCardAttempt, getUserDeckProgress, saveUserDeckProgress, getDeckProgress, purchasePowerUp, getDeckPurchaseCounts, getUserXpStats } from '@/lib/firestore';
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


const levelUpMessages = [
    "LEVEL UP! 🚀",
    "Great job! Keep going! ✨",
    "You're on a roll! 🔥",
    "Knowledge unlocked! 🧠",
    "Mastery in progress! 🌟"
];

const BLOOM_LEVELS: BloomLevel[] = [ "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create" ];

async function fetchLevelCards(db: any, userId: string, deckId: string, currentLevel: BloomLevel): Promise<Flashcard[]> {
    const q = query(collection(db, 'userTopics', userId, 'decks', deckId, 'cards'));
    const cardsSnap = await getDocs(q);
    const cardsArray = cardsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
    
    const BRACKETED = /^\s*\[([^\]]+)\]/;
    const normalized = cardsArray.map(card => {
        const m = BRACKETED.exec(card.questionStem || '');
        const bloomLevel = m ? m[1] as BloomLevel : card.bloomLevel;
        return {
            ...card,
            bloomLevel,
        };
    });

    const levelCards = normalized.filter(c => c.bloomLevel === currentLevel);
    
    // Simple random shuffle on fetch
    return levelCards.sort(() => Math.random() - 0.5);
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


export default function QuestStudyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useUserAuth();
  const { settings } = useUserSettings();
  const db = getDb();
  const { deckId } = params as { deckId: string };

  const [deck, setDeck] = useState<Deck | null>(null);
  
  // State management as per user instructions
  const [levelIndex, setLevelIndex] = useState(0);    // 0 ⇒ “Remember”, 1 ⇒ “Understand”, etc.
  const [cardIndex, setCardIndex] = useState(0);      // which card in the current level
  const [cards, setCards] = useState<Flashcard[]>([]); // cards for the current level

  const [purchaseCounts, setPurchaseCounts] = useState<PurchaseCounts>({ 'hint': 0, 'retry': 0, 'fifty-fifty': 0, 'time': 0, 'focus': 0, 'unlock': 0 });
  const [loading, setLoading] = useState(true);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);
  const [xpStats, setXpStats] = useState<UserXpStats | null>(null);
  
  // Power-Up State
  const [powerUpsExpanded, setPowerUpsExpanded] = useState(false);
  const [isRetryArmed, setIsRetryArmed] = useState(false);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  
  // Milestone State
  const [showMilestone, setShowMilestone] = useState(false);
  
  const currentLevel = BLOOM_LEVELS[levelIndex];

  // Load cards for the current level
  useEffect(() => {
    if (!user || !db || !currentLevel) return;

    setLoading(true);
    fetchLevelCards(db, user.uid, deckId, currentLevel)
        .then(fetched => {
            if (fetched.length > 0) {
                setCards(fetched);
                setCardIndex(0); // reset to first card whenever level changes
            } else {
                // If no cards at this level, try the next one
                if (levelIndex + 1 < BLOOM_LEVELS.length) {
                    setLevelIndex(levelIndex + 1);
                } else {
                    setIsSessionComplete(true);
                }
            }
        })
        .finally(() => setLoading(false));
  }, [levelIndex, user, db, deckId, currentLevel]);


  // Fetch initial deck data and user progress once
  useEffect(() => {
    const setupSession = async () => {
        if (!user || !deckId) return;
        
        try {
            const [foundDeck, progress, counts, stats] = await Promise.all([
                getDeck(user.uid, deckId), // Efficiently fetch only the current deck
                getUserDeckProgress(user.uid, deckId),
                getDeckPurchaseCounts(user.uid, deckId),
                getUserXpStats(user.uid)
            ]);
            
            if (!foundDeck || foundDeck.cards.length === 0) {
                toast({ variant: 'destructive', title: 'Error', description: 'Deck not found or is empty.' });
                router.push('/decks');
                return;
            }
            
            setDeck(foundDeck);
            setDeckProgress(progress as any);
            setPurchaseCounts(counts);
            setXpStats(stats);

            const isNewQuest = searchParams.get('new') === 'true';
            if (isNewQuest && progress) {
              (progress as any).streak = 0;
              setLevelIndex(0);
              setCardIndex(0);
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load study session.' });
        }
    };
    setupSession();
  }, [deckId, toast, router, user, searchParams]);

  const onAnswerSubmitted = useCallback(() => {
    setDisabledOptions([]); // Reset 50/50 for next card
    if (cardIndex + 1 < cards.length) {
        // move to the next card in this level
        setCardIndex(cardIndex + 1);
    } else {
        // we’ve viewed & answered every card in this level
        if (levelIndex + 1 < BLOOM_LEVELS.length) {
            setShowMilestone(true); // Show milestone before advancing
        } else {
            setIsSessionComplete(true);
        }
    }
  }, [cardIndex, cards.length, levelIndex]);
  
  const advanceToNextLevel = () => {
      setLevelIndex(levelIndex + 1);
  };
  
  const currentCard = cards[cardIndex];

  const handleLogAttempt = (card: Flashcard, wasCorrect: boolean) => {
    if (!user) return;
    
    logCardAttempt(user.uid, {
      deckId: deckId,
      cardId: String(card.id),
      bloomLevel: card.bloomLevel,
      wasCorrect: wasCorrect,
      timestamp: new Date(),
    }).then(({ deckMastered, awardedTokens, xpBreakdown }) => {
      if (wasCorrect) {
          let xpMessage = `+${xpBreakdown.base} XP (${card.bloomLevel})`;
          if (xpBreakdown.streakBonus > 0) xpMessage += ` • +${xpBreakdown.streakBonus} XP (Streak)`;
          if (xpBreakdown.weakCardBonus > 0) xpMessage += ` • +${xpBreakdown.weakCardBonus} XP (Weak Card)`;
          if (xpBreakdown.recencyBonus < 0) xpMessage += ` • ${xpBreakdown.recencyBonus} XP (Recency)`;

          toast({
            title: 'Correct!',
            description: xpMessage
          });

          if (awardedTokens > 0) {
             toast({
                title: `+${awardedTokens} Tokens Earned!`,
            });
          }
          if (deckMastered) {
             toast({
                title: "Deck Mastered! 🎉",
                description: "You've mastered all concepts in this deck! +100 bonus tokens!",
                duration: 5000,
            });
          }
      }
    }).catch(error => {
      console.error("Failed to log attempt:", error);
      toast({ variant: "destructive", title: "Sync Error", description: "Could not save your progress." });
    });
  };

  const handleUsePowerUp = async (type: PowerUpType, cost: number) => {
    if (!user || !currentCard) return;

    try {
        await purchasePowerUp(user.uid, deckId, type, cost);
        
        setPurchaseCounts(prev => ({...prev, [type]: (prev[type] || 0) + 1 }));

        if (type === 'retry') {
            setIsRetryArmed(true);
        }
        if (type === 'fifty-fifty' && (currentCard.cardFormat === 'Standard MCQ' || currentCard.cardFormat === 'Two-Tier MCQ')) {
            const card = currentCard as StandardMCQCard; // Both have tier1
            const wrongIndices = card.tier1.options
                .map((_, i) => i)
                .filter(i => i !== card.tier1.correctAnswerIndex);
            setDisabledOptions(shuffleArray(wrongIndices).slice(0, 2));
        }
        
        toast({ title: 'Power-Up Used!', description: `Spent ${cost} tokens.`});
        
    } catch(e: any) {
        toast({ variant: 'destructive', title: `Could not use ${type}`, description: e.message });
        if(user) {
            getDeckPurchaseCounts(user.uid, deckId).then(c => setPurchaseCounts(c));
        }
    }
  }

  if (loading || !currentCard) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isSessionComplete) {
    return (
       <main className="container mx-auto max-w-2xl p-4 py-8 text-center">
         <Card className="p-8">
            <CardHeader>
                <PartyPopper className="h-16 w-16 text-primary mx-auto" />
                <CardTitle className="text-3xl font-bold mt-4">Congratulations!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">You've completed this study session. Check your progress to see how you did!</p>
                <div className="flex justify-center gap-4">
                    <Button asChild>
                        <Link href="/dashboard">View Progress</Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href={`/decks/${deckId}/study`}>Study Again</Link>
                    </Button>
                </div>
            </CardContent>
         </Card>
       </main>
    )
  }

  const progress = Math.round(((cardIndex + 1) / cards.length) * 100);
  const cardsLeft = cards.length - cardIndex;

  return (
    <StudyMissionLayout
      deckTitle={deck?.title || 'Quest'}
      deckLevel={deckProgress?.level}
      progress={progress}
      tokens={settings?.tokens || 0}
      powerUpsExpanded={powerUpsExpanded}
      setPowerUpsExpanded={setPowerUpsExpanded}
      onUsePowerUp={handleUsePowerUp}
      purchaseCounts={purchaseCounts}
      currentLevelName={currentLevel}
      cardsLeftInLevel={cardsLeft}
    >
      <AlertDialog open={showMilestone} onOpenChange={setShowMilestone}>
        <AlertDialogContent>
            <AlertDialogHeader className="items-center text-center">
                <Award className="h-12 w-12 text-primary" />
                <AlertDialogTitle>Field Objective Complete!</AlertDialogTitle>
                <AlertDialogDescription>
                    You've cleared all cards for the <span className="font-bold">{currentLevel}</span> level. Great work, Agent. Keep up the momentum.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center">
                <AlertDialogCancel onClick={() => router.push(`/decks/${deckId}/study`)}>Return to Briefing Room</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    setShowMilestone(false);
                    advanceToNextLevel();
                }}>
                    Continue Main Quest
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
                        onNextCard={onAnswerSubmitted}
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
