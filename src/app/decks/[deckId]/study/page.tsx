
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import { getDeck, getUserDeckProgress } from '@/lib/firestore';
import type { Deck, UserDeckProgress } from '@/types';
import { Loader2, Info, CaseUpper, Shuffle, Target, Star, Timer, BookOpen, Rocket, RefreshCw } from 'lucide-react';
import DebriefBanner from '@/components/DebriefBanner';
import MissionCard from '@/components/MissionCard';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const missionTabs = [
    { key: 'quest', label: 'Quest', icon: CaseUpper },
    { key: 'remix', label: 'Remix', icon: Shuffle },
    { key: 'practice', label: 'Practice', icon: Target },
    { key: 'starred', label: 'Starred', icon: Star },
    { key: 'timed', label: 'Timed', icon: Timer },
    { key: 'level-up', label: 'Level Up', icon: BookOpen },
    { key: 'topic-trek', label: 'Topic Trek', icon: Rocket },
];

const MOCK_DECK: Deck = {
    id: 'mock-deck',
    title: 'Example Deck (Logged Out)',
    description: 'This is a sample deck for viewing the UI.',
    cards: [],
};

const MOCK_PROGRESS: UserDeckProgress = {
    level: 3,
    xp: 50,
    xpToNext: 150,
    streak: 0,
    lastCardIndex: 0,
    mode: 'quest'
};


export default function StudyHubPage() {
    const { deckId } = useParams() as { deckId: string };
    const { user } = useUserAuth();
    const router = useRouter();
    const [deck, setDeck] = useState<Deck | null>(null);
    const [progress, setProgress] = useState<UserDeckProgress | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            // Handle logged out state
            setDeck(MOCK_DECK);
            setProgress(MOCK_PROGRESS);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const [deckData, progressData] = await Promise.all([
                    getDeck(user.uid, deckId),
                    getUserDeckProgress(user.uid, deckId),
                ]);

                if (!deckData) {
                    // Deck not found, redirect
                    router.push('/decks');
                    return;
                }

                setDeck(deckData);
                setProgress(progressData);
            } catch (error) {
                console.error("Failed to fetch study hub data:", error);
                router.push('/decks');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, deckId, router]);
    
    if (loading) {
        return (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }

    if (!deck) {
        return (
             <div className="flex h-screen items-center justify-center">
                <p>Deck not found. Redirecting...</p>
            </div>
        )
    }
    
    const deckLevel = progress?.level || 1;
    const deckXp = progress?.xp || 0;
    const deckXpToNext = progress?.xpToNext || 100;
    const hasStartedQuest = progress && progress.lastCardIndex > 0;

    return (
        <main className="min-h-screen bg-gray-50/50">
            <header className="border-b bg-white">
                <nav className="container mx-auto px-6 flex items-center gap-6">
                    {missionTabs.map(tab => (
                       <Link
                          key={tab.key}
                          href={`/decks/${deckId}/study/${tab.key}`}
                          className={cn(
                            "flex items-center gap-2 py-4 border-b-2 border-transparent text-muted-foreground hover:text-primary hover:border-primary transition-colors",
                            // Example of how to style the active tab
                            // pathname.endsWith(tab.key) && "text-primary border-primary" 
                          )}
                        >
                          <tab.icon className="h-4 w-4" />
                          <span className="text-sm font-medium">{tab.label}</span>
                        </Link>
                    ))}
                </nav>
            </header>
            
            <div className="container mx-auto max-w-4xl p-4 py-8">
                <section className="text-center mb-8">
                    <Info className="h-10 w-10 mx-auto text-primary mb-2" />
                    <h1 className="text-3xl font-bold">Agent Briefing</h1>
                    <p className="text-muted-foreground mt-1">
                        Agent, your dossier for <span className="font-semibold text-primary">{deck.title}</span> is ready. Select your assignment.
                    </p>
                     <div className="max-w-md mx-auto mt-4 bg-white p-3 rounded-lg border">
                        <div className="flex justify-between items-center text-sm font-medium mb-1">
                            <span>Deck Level: {deckLevel}</span>
                            <span>{deckXp} / {deckXpToNext} XP</span>
                        </div>
                        <Progress value={(deckXp/deckXpToNext) * 100} />
                    </div>
                </section>

                <DebriefBanner recommendation="We recommend you finish the Quest to tailor the rest of your tasks." />
                
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MissionCard
                        icon={CaseUpper}
                        title="Operation: Quest"
                        description="Standard-issue progression. Complete objectives in order."
                    >
                        {hasStartedQuest ? (
                            <>
                                <Button className="w-full" disabled>Continue Mission</Button>
                                <Button variant="ghost" className="w-full" disabled>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Restart Mission
                                </Button>
                            </>
                        ) : (
                            <Button className="w-full" disabled>Begin Mission</Button>
                        )}
                    </MissionCard>
                    <MissionCard
                        icon={Shuffle}
                        title="Operation: Random Remix"
                        description="A chaotic encounter. All intel is randomized."
                    >
                         <Button className="w-full" disabled>Begin Mission</Button>
                    </MissionCard>
                    <MissionCard
                        icon={Target}
                        title="Operation: Target Practice"
                        description="Hone your skills by focusing on known weak points."
                    >
                         <Button className="w-full" disabled>Engage Target (25 cards)</Button>
                    </MissionCard>
                     <MissionCard
                        icon={Star}
                        title="Operation: Starred Assets"
                        description="Review high-value intel you've personally marked."
                    >
                         <Button className="w-full" disabled>Review Starred</Button>
                    </MissionCard>
                     <MissionCard
                        icon={Timer}
                        title="Operation: Timed Drill"
                        description="A high-pressure speed trial. Answer before the clock runs out."
                    >
                         <Button className="w-full" disabled>Start Drill</Button>
                    </MissionCard>
                     <MissionCard
                        icon={BookOpen}
                        title="Operation: Level Up"
                        description="Advance your clearance one cognitive level at a time."
                    >
                         <Button className="w-full" disabled>Enter Level-Up</Button>
                    </MissionCard>
                    <MissionCard
                        icon={Rocket}
                        title="Operation: Topic Trek"
                        description="Infiltrate specific subjects by topic tag."
                    >
                         <Button className="w-full" disabled>Explore Topics</Button>
                    </MissionCard>
                </div>
            </div>
        </main>
    )
}
