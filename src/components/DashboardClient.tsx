
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import type { Deck as DeckType, DeckProgress, BloomLevel, Topic, UserDeckProgress, GlobalProgress, UserPowerUps, UserXpStats, UserSettings } from '@/stitch/types';
import { Loader2, User, BookOpen, Award, Coins, LineChart, ChevronDown, CheckCircle, Target, Zap, Vault, GripVertical, Rocket, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import Link from 'next/link';
import { getDeckProgress, getTopics, getUserProgress, getUserXpStats } from '@/lib/firestore';
import GlobalProgressHeader from './GlobalProgressHeader';
import { useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { useUserSettings } from '@/hooks/useUserSettings';
import AgentCard from './AgentCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Timestamp } from 'firebase/firestore';


const DevVaultPanel = dynamic(
  () => import('@/components/DevVaultPanel'),
  {
    ssr: false,
    loading: () => <p className="text-sm text-center p-4">Loading vault...</p>
  }
);


const StatCard = ({ title, value, unit, icon, ...props }: { title: string, value: string | number, unit?: string, icon: React.ReactNode, [key: string]: any }) => (
  <Card className="text-center p-4 h-full" {...props}>
    <CardHeader className="p-2 flex-row items-center justify-center gap-2">
      {icon}
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent className="p-2">
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-lg font-medium">{unit}</span>}
      </div>
    </CardContent>
  </Card>
);

const bloomOrder: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

const MOCK_GLOBAL_PROGRESS: GlobalProgress = { level: 5, xp: 250, xpToNext: 1000, total: 0, reviewed: 0, percent: 0 };
const MOCK_SETTINGS: UserSettings = { displayName: 'Mock User', email: 'mock@example.com', tokens: 1250, unlockedLevels: {} } as UserSettings;
const MOCK_DECK_PROGRESS: DeckProgress[] = [
    { deckId: 'mock1', deckName: 'Cellular Respiration', totalCards: 25, lastStudied: new Date(), isMastered: false, level: 3, xp: 40, xpToNext: 150, bloomMastery: { 'Remember': { correct: 8, total: 10 }, 'Understand': { correct: 5, total: 7 }}},
    { deckId: 'mock2', deckName: 'Photosynthesis', totalCards: 30, lastStudied: new Date(), isMastered: true, level: 5, xp: 110, xpToNext: 200, bloomMastery: { 'Remember': { correct: 10, total: 10 }, 'Understand': { correct: 9, total: 10 }, 'Apply': {correct: 8, total: 10 }}},
];
const MOCK_XP_STATS: UserXpStats = { sessionXP: 120, dailyXP: 850, bonusVault: 50, commanderXP: (MOCK_GLOBAL_PROGRESS?.xp ?? 0), sessionStart: new Date(), lastDailyReset: new Date(), isXpBoosted: true };

type DashboardSection = 'header' | 'devControls' | 'dossiers' | 'progressChart';
const initialSections: DashboardSection[] = ['header', 'devControls', 'dossiers', 'progressChart'];

export default function DashboardClient() {
    const [deckProgress, setDeckProgress] = useState<DeckProgress[]>([]);
    const [globalProgress, setGlobalProgress] = useState<GlobalProgress | null>(null);
    const { user } = useUserAuth();
    const { settings, loading: settingsLoading } = useUserSettings();
    const [xpStats, setXpStats] = useState<UserXpStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();
    const [showExample, setShowExample] = useState(false);

    const [devMode, setDevMode] = useState(false);
    const [showVault, setShowVault] = useState(false);

    const [sections, setSections] = useState<DashboardSection[]>(initialSections);

    useEffect(() => {
        // This code runs only on the client
        const devModeActive = localStorage.getItem("devMode") === "true";
        setDevMode(devModeActive);
    }, []);

    useEffect(() => {
        const fetchProgress = async () => {
            if (!user) {
                // If user is not logged in, use mock data by default
                setShowExample(true);
                setIsLoading(false);
                return;
            };

            setIsLoading(true);

            const [userTopics, attempts, userProgress, userXpStats] = await Promise.all([
                getTopics(user.uid),
                getDeckProgress(user.uid),
                getUserProgress(user.uid),
                getUserXpStats(user.uid)
            ]);

            setGlobalProgress((userProgress as any).global as GlobalProgress);
            setXpStats(userXpStats);

            const allDecks: DeckType[] = userTopics.flatMap(t => t.decks || []);

            const progressByDeck: { [deckId: string]: DeckProgress } = {};

            // Initialize progress for all decks from the topics data
            for (const deck of allDecks) {
                if (!deck || !deck.id) continue;
                const deckSpecificProgress = (userProgress.decks ?? {})[deck.id] || { level: 1, xp: 0, xpToNext: 100 };
                
                progressByDeck[deck.id] = {
                    deckId: deck.id,
                    deckName: deck.title,
                    totalCards: deck.cards?.length || 0,
                    isMastered: deck.isMastered || false,
                    lastStudied: new Date(0), // Default value
                    bloomMastery: {},
                    ...deckSpecificProgress,
                };
            }

            // Fold in attempt data
            for (const attempt of attempts) {
                if (!attempt.deckId || !progressByDeck[attempt.deckId]) continue;

                const current = progressByDeck[attempt.deckId];
                
                const attemptTimestamp = attempt.timestamp instanceof Timestamp ? attempt.timestamp.toDate() : new Date(0);
                const lastStudiedTimestamp = current.lastStudied instanceof Date ? current.lastStudied : new Date(current.lastStudied);

                if (attemptTimestamp > lastStudiedTimestamp) {
                    current.lastStudied = attempt.timestamp;
                }

                const level = attempt.bloomLevel as BloomLevel;
                if (!current.bloomMastery[level]) {
                    current.bloomMastery[level] = { correct: 0, total: 0 };
                }
                const mastery = current.bloomMastery[level]!;
                mastery.total += 1;
                if (attempt.wasCorrect) {
                    mastery.correct += 1;
                }
            }
            
            const finalProgress = Object.values(progressByDeck).sort((a,b) => {
                const aTime = a.lastStudied instanceof Date ? a.lastStudied.getTime() : new Date(a.lastStudied).getTime();
                const bTime = b.lastStudied instanceof Date ? b.lastStudied.getTime() : new Date(b.lastStudied).getTime();
                return bTime - aTime;
            });


            setDeckProgress(finalProgress);
            setIsLoading(false);
        };
        fetchProgress();
    }, [user]);

    const overallStats = useMemo(() => {
        const source = showExample ? MOCK_DECK_PROGRESS : deckProgress;
        let totalReviewed = 0;
        let masteredDecks = 0;

        source.forEach(deck => {
            if (deck.isMastered) masteredDecks++;
            const bm = deck.bloomMastery as Partial<Record<BloomLevel, { correct: number; total: number }>>;
            Object.values(bm ?? {}).forEach(level => {
                if (level && typeof level.total === "number") totalReviewed += level.total;
            });
        });

        return { reviewed: totalReviewed, masteredDecks };
    }, [deckProgress, showExample]);

    if (isLoading || settingsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!user && !showExample) {
        return (
          <div className="flex h-screen items-center justify-center">
            <Card className="w-full max-w-md text-center shadow-lg p-8">
                <CardHeader>
                    <User className="mx-auto h-16 w-16 text-primary" />
                    <CardTitle className="font-headline text-2xl mt-4">Welcome to BloomCrux</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">Please log in or sign up to view your progress dashboard.</p>
                    <div className="flex justify-center gap-4">
                        <Button asChild>
                           <Link href="/login">Login</Link>
                        </Button>
                         <Button asChild variant="secondary">
                           <Link href="/signup">Sign Up</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
        )
    }

    const progressToDisplay = showExample ? MOCK_DECK_PROGRESS : deckProgress;
    const globalProgressToDisplay = showExample ? MOCK_GLOBAL_PROGRESS : globalProgress;
    const settingsToDisplay = showExample ? MOCK_SETTINGS : settings;
    const xpStatsToDisplay = showExample ? MOCK_XP_STATS : xpStats;

    const sectionsMap: Record<DashboardSection, React.ReactNode> = {
        header: (
         <Card>
             <CardHeader className="flex-row items-center justify-between p-4">
                <CardTitle>Commander Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 flex flex-col gap-6">
                        <GlobalProgressHeader global={globalProgressToDisplay} xpStats={xpStatsToDisplay} />
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                            <StatCard title="Total Cards Reviewed" value={overallStats.reviewed} icon={<BookOpen />} />
                            <StatCard title="Decks Mastered" value={overallStats.masteredDecks} icon={<Award />} />
                         </div>
                    </div>
                    <div className="md:col-span-1 h-full">
                        <AgentCard 
                            globalProgress={globalProgressToDisplay} 
                            settings={settingsToDisplay ? {displayName: settingsToDisplay.displayName ?? "", tokens: settingsToDisplay.tokens ?? 0} : null}
                            photoURL={user?.photoURL}
                        />
                    </div>
                </div>
            </CardContent>
         </Card>
        ),
        devControls: devMode ? (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Vault className="h-5 w-5 text-primary" />
                        Developer Controls
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Button onClick={() => setShowVault(!showVault)}>
                        {showVault ? 'Hide' : 'Show'} Dev Vault
                    </Button>
                    <Button variant="destructive" onClick={() => {
                        localStorage.removeItem("devMode");
                        setDevMode(false);
                        setShowVault(false);
                    }}>
                        Deactivate Dev Mode
                    </Button>
                </CardContent>
            </Card>
        ) : null,
        dossiers: (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Deck Dossiers</CardTitle>
                </CardHeader>
                <CardDescription className="px-6 pb-4">Select a deck to continue your training.</CardDescription>
                <CardContent className="space-y-4">
                {progressToDisplay.length > 0 ? (
                    progressToDisplay.map(progress => (
                        <Collapsible key={progress.deckId} className="border rounded-lg p-4" defaultOpen>
                        <CollapsibleTrigger className="flex justify-between items-center w-full">
                            <div className="text-left">
                                <h4 className="font-semibold">{progress.deckName}</h4>
                                <p className="text-sm text-muted-foreground">Level {progress.level} - {progress.xp}/{progress.xpToNext} XP</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {progress.isMastered && <Award className="h-5 w-5 text-yellow-500" />}
                                <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-4 space-y-3">
                            <div className="space-y-2">
                                {(Object.keys(progress.bloomMastery) as BloomLevel[]).map(level => {
                                const bm = progress.bloomMastery as Partial<Record<BloomLevel, { correct: number; total: number }>>;
                                const levelData = bm[level];
                                if(!levelData || levelData.total === 0) return null;
                                const accuracy = Math.round((levelData.correct / levelData.total) * 100);
                                const isMastered = accuracy >= 80;
                                return (
                                    <div key={level}>
                                        <div className="flex justify-between items-center text-sm mb-1">
                                            <span className="font-medium">{level}</span>
                                            <span className={cn("font-semibold", isMastered ? "text-green-600" : "text-amber-600")}>{accuracy}%</span>
                                        </div>
                                        <Progress value={accuracy} className={isMastered ? "[&>div]:bg-green-500" : "[&>div]:bg-amber-500"}/>
                                    </div>
                                )
                                })}
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/decks/${progress.deckId}/study/level-up`}>
                                        <Rocket className="mr-2 h-4 w-4" /> Level Up
                                    </Link>
                                </Button>
                                <Button size="sm" asChild>
                                    <Link href={`/decks/${progress.deckId}/study`}>Continue Study</Link>
                                </Button>
                            </div>
                        </CollapsibleContent>
                        </Collapsible>
                    ))
                    ) : (
                    <div className="text-center py-10 col-span-full">
                        <p className="text-muted-foreground mb-4">
                            No decks found. Create a deck and start studying to see your progress!
                        </p>
                        <Button asChild className="mb-2">
                            <Link href="/decks">Create a Deck</Link>
                        </Button>
                    </div>
                    )}
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/agent-classified" passHref>
                        <Button variant="link" className="text-xs text-muted-foreground hover:text-foreground">... Agent Classified</Button>
                    </Link>
                </CardFooter>
            </Card>
        ),
        progressChart: (
            <Card className="mt-6 bg-muted/30">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground">
                        <LineChart className="h-5 w-5" />
                        Progress Over Time
                    </CardTitle>
                </CardHeader>
                <CardDescription className="px-6 pb-4">This chart will show your review activity and mastery trends over the past month. Coming soon!</CardDescription>
                <CardContent className="h-48 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Chart data will appear here.</p>
                </CardContent>
            </Card>
        )
    };


    return (
        <div className="container mx-auto px-6 py-12">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-headline text-foreground mb-1">Commander Debriefing</h1>
                        <p className="text-base text-muted-foreground font-body">Review your overall performance and deck-specific mastery levels.</p>
                    </div>
                    {user && (
                         <Button variant="link" onClick={() => setShowExample(!showExample)}>
                            {showExample ? 'Hide Example' : 'Show Example Data'}
                        </Button>
                    )}
                </div>
                
                {showExample && (
                    <Alert variant="default" className="bg-blue-50 border-blue-200">
                        <Info className="h-5 w-5 text-blue-700" />
                        <AlertTitle className="text-blue-800 font-semibold">Viewing Mock Data</AlertTitle>
                        <AlertDescription className="text-blue-700">
                        This is a preview of the dashboard. {!user ? <>Please <Link href="/login" className="font-bold underline">log in</Link> to see your personal progress.</> : 'Click "Hide Example" to see your real progress.'}
                        </AlertDescription>
                    </Alert>
                )}

                {xpStatsToDisplay && xpStatsToDisplay.bonusVault > 0 && (
                    <Card className="my-6 bg-yellow-50 border-yellow-300">
                        <CardContent className="p-4 flex items-center gap-4">
                           <div className="p-2 bg-yellow-100 rounded-full">
                             <Zap className="h-5 w-5 text-yellow-600" />
                           </div>
                           <div>
                            <p className="font-bold text-yellow-800">Bonus Vault Ready!</p>
                            <p className="text-sm text-yellow-700">You have {xpStatsToDisplay.bonusVault} bonus XP waiting for tomorrow!</p>
                           </div>
                        </CardContent>
                    </Card>
                )}

                {xpStatsToDisplay && xpStatsToDisplay.isXpBoosted && (
                     <Card className="my-6 bg-blue-50 border-blue-300">
                        <CardContent className="p-4 flex items-center gap-4">
                           <div className="p-2 bg-blue-100 rounded-full">
                             <Zap className="h-5 w-5 text-blue-600" />
                           </div>
                           <div>
                            <p className="font-bold text-blue-800">2x XP Booster Active!</p>
                            <p className="text-sm text-blue-700">All XP gains in your current session are doubled!</p>
                           </div>
                        </CardContent>
                    </Card>
                )}
                
                {devMode && showVault && <DevVaultPanel />}

                <div className="space-y-8">
                  {initialSections.map((sectionId) => {
                    const cardElement = sectionsMap[sectionId];
                    if (!cardElement) return null;
                    return (
                      <div key={sectionId}>
                        {cardElement}
                      </div>
                    );
                  })}
                </div>
            </div>
        </div>
    );
}
