"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Lock, BookOpen, Coins } from 'lucide-react';
import Link from 'next/link';
import { useUserAuth } from "@/app/Providers/AuthProvider";
import { getTopics, getDeckProgress, resetDeckPurchaseCounts } from '@/lib/firestore';
import type { Deck, DeckProgress, BloomLevel, UserPowerUps, UserSettings } from '@/stitch/types';
import { ProgressRing } from '@/components/ui/progress-ring';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings';

const bloomOrder: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const masteryThreshold = 0.8; // 80%
const UNLOCK_COST = 200; // Cost in tokens to unlock the next level

const levelDescriptions: Record<BloomLevel, { description: string, icon: React.ReactNode }> = {
    'Remember': { description: "Recall facts and basic concepts.", icon: <BookOpen className="h-6 w-6" /> },
    'Understand': { description: "Explain ideas or concepts.", icon: <BookOpen className="h-6 w-6" /> },
    'Apply': { description: "Use information in new situations.", icon: <BookOpen className="h-6 w-6" /> },
    'Analyze': { description: "Draw connections among ideas.", icon: <BookOpen className="h-6 w-6" /> },
    'Evaluate': { description: "Justify a stand or decision.", icon: <BookOpen className="h-6 w-6" /> },
    'Create': { description: "Produce new or original work.", icon: <BookOpen className="h-6 w-6" /> },
}

export default function LevelUpPage() {
    const params = useParams();
    const router = useRouter();
    const { deckId } = params as { deckId: string };
    const { user } = useUserAuth();
    const { toast } = useToast();
    const { settings, updateSettings, loading: settingsLoading } = useUserSettings();

    const [deck, setDeck] = useState<Deck | null>(null);
    const [overallProgress, setOverallProgress] = useState<DeckProgress | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeckAndProgress = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const [topics, allAttempts] = await Promise.all([
                    getTopics(user.uid),
                    getDeckProgress(user.uid),
                ]);

                const foundDeck = topics.flatMap(t => t.decks).find(d => d.id === deckId);
                
                if (!foundDeck) {
                    router.push('/decks');
                    return;
                }
                setDeck(foundDeck);
                
                const deckAttempts = allAttempts.filter(a => a.deckId === deckId);
                
                const deckMastery: DeckProgress = {
                    deckId: deckId,
                    deckName: foundDeck.title,
                    totalCards: foundDeck.cards.length,
                    isMastered: foundDeck.isMastered || false,
                    lastStudied: new Date(0),
                    bloomMastery: {},
                } as any;

                if(deckAttempts.length > 0) {
                    deckMastery.lastStudied = new Date(Math.max(...deckAttempts.map(a => a.timestamp.getTime())));
                    deckAttempts.forEach(attempt => {
                        if (!deckMastery.bloomMastery[attempt.bloomLevel]) {
                            deckMastery.bloomMastery[attempt.bloomLevel] = { correct: 0, total: 0 };
                        }
                        const mastery = deckMastery.bloomMastery[attempt.bloomLevel]!;
                        mastery.total++;
                        if (attempt.wasCorrect) mastery.correct++;
                    });
                }
                setOverallProgress(deckMastery);

            } catch (error) {
                console.error("Failed to fetch level up data:", error);
                router.push('/decks');
            } finally {
                setLoading(false);
            }
        };

        fetchDeckAndProgress();
    }, [user, deckId, router]);
    
    const handleUnlockLevel = async (levelToUnlock: BloomLevel) => {
        if (!user || !settings || settings.tokens < UNLOCK_COST) {
            toast({
                variant: 'destructive',
                title: 'Not enough tokens',
                description: `You need ${UNLOCK_COST} tokens to unlock this level.`,
            });
            return;
        }

        try {
            const newUnlocked = settings.unlockedLevels || {};
            if (!newUnlocked[deckId]) {
                newUnlocked[deckId] = [];
            }
            newUnlocked[deckId].push(levelToUnlock);

            await updateSettings({
                tokens: settings.tokens - UNLOCK_COST,
                unlockedLevels: newUnlocked,
            });
            
            await resetDeckPurchaseCounts(user.uid, deckId);

            toast({
                title: 'Level Unlocked!',
                description: `You spent ${UNLOCK_COST} tokens to unlock the "${levelToUnlock}" level. Power-up prices for this deck have been reset!`,
            });
        } catch (error) {
            console.error('Failed to unlock level:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not unlock level.' });
        }
    }
    
    if (loading || settingsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!deck) {
        return (
             <div className="flex h-screen items-center justify-center">
                <p>Deck not found.</p>
             </div>
        )
    }

    let previousLevelMastered = true;
    const unlockedByTokens = settings?.unlockedLevels?.[deckId] || [];

    return (
        <main className="container mx-auto max-w-2xl p-4 py-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-headline">Bloom Ladder: <span className="text-primary">{deck.title}</span></h1>
                <p className="text-muted-foreground mt-2 font-body">Master each level of thinking to climb the ladder.</p>
            </div>
            <div className="space-y-4">
                {bloomOrder.map(level => {
                    const progress = overallProgress?.bloomMastery?.[level];
                    const accuracy = progress && progress.total > 0 ? (progress.correct / progress.total) : 0;
                    const isMasteredByAccuracy = accuracy >= masteryThreshold;
                    const isUnlockedByTokens = unlockedByTokens.includes(level);
                    
                    const canAccess = previousLevelMastered;
                    const isMastered = isMasteredByAccuracy || isUnlockedByTokens;
                    
                    const cardsInLevel = deck.cards.filter(c => c.bloomLevel === level).length;

                    if (cardsInLevel === 0) {
                        previousLevelMastered = isMastered;
                        return null;
                    }

                    const currentLevelCanBeAccessed = canAccess;
                    previousLevelMastered = isMastered;


                    return (
                        <Card key={level} className="flex items-center p-4 gap-4">
                            <div className="flex-shrink-0">
                                <ProgressRing value={accuracy * 100} />
                            </div>
                            <div className="flex-grow">
                                <h2 className="font-bold text-lg">{level}</h2>
                                <p className="text-sm text-muted-foreground">{levelDescriptions[level].description}</p>
                            </div>
                            <div className="flex-shrink-0">
                                {currentLevelCanBeAccessed ? (
                                    isMastered ? (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <Check className="h-6 w-6" />
                                            <span>Mastered</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2 items-end">
                                            <Button asChild>
                                                <Link href={`/decks/${deckId}/study?mode=bloom-focus&level=${level}`}>
                                                    Begin Study
                                                    <BookOpen className="ml-2 h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button 
                                                variant="secondary" 
                                                size="sm"
                                                onClick={() => handleUnlockLevel(level)}
                                                disabled={(settings?.tokens || 0) < UNLOCK_COST}
                                            >
                                                <Coins className="mr-2 h-4 w-4" />
                                                Unlock for {UNLOCK_COST}
                                            </Button>
                                        </div>
                                    )
                                ) : (
                                    <Button disabled>
                                        <Lock className="mr-2 h-4 w-4" />
                                        Locked
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )
                })}
            </div>
        </main>
    );
}
