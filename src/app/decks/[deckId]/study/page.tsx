

'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import { getDeck, getUserDeckProgress } from '@/lib/firestore';
import type { Deck, UserDeckProgress } from '@/types';
import { Loader2, Briefcase, CaseUpper, Shuffle, Target, Star, Timer, BookOpen, Rocket, RefreshCw } from 'lucide-react';
import DebriefBanner from '@/components/DebriefBanner';
import MissionCard from '@/components/MissionCard';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    lastCardIndex: 0,
    mode: 'quest',
    streak: 0,
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
    const hasStartedQuest = progress && progress.lastCardIndex > 0 && progress.mode === 'quest';
    const hasStartedRemix = progress && progress.randomOrder && progress.randomOrder.length > 0 && progress.mode === 'remix';
    const percent = deckXpToNext > 0 ? (deckXp / deckXpToNext) * 100 : 0;

    const missions = [
        {
            id: 'quest',
            icon: CaseUpper,
            title: 'Operation: Quest',
            description: 'Standard-issue progression. Complete objectives in order.',
            children: hasStartedQuest ? (
                <>
                    <Button className="w-full" asChild>
                        <Link href={`/decks/${deckId}/study/quest`}>Continue Mission</Link>
                    </Button>
                    <Button variant="ghost" className="w-full" asChild>
                        <Link href={`/decks/${deckId}/study/quest?new=true`}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Restart Mission
                        </Link>
                    </Button>
                </>
            ) : (
                <Button className="w-full" asChild>
                    <Link href={`/decks/${deckId}/study/quest`}>Begin Mission</Link>
                </Button>
            ),
        },
        {
            id: 'random-remix',
            icon: Shuffle,
            title: 'Operation: Random Remix',
            description: 'A chaotic encounter. All intel is randomized.',
            children: hasStartedRemix ? (
                 <Button className="w-full" asChild>
                    <Link href={`/decks/${deckId}/study/random-remix`}>Continue Mission</Link>
                </Button>
             ) : (
                 <Button className="w-full" asChild>
                    <Link href={`/decks/${deckId}/study/random-remix`}>Begin Mission</Link>
                </Button>
             ),
        },
        {
            id: 'practice',
            icon: Target,
            title: 'Operation: Target Practice',
            description: 'Hone your skills by focusing on known weak points.',
            children: <Button className="w-full" asChild><Link href={`/decks/${deckId}/study/practice`}>Engage Targets</Link></Button>,
        },
        {
            id: 'starred',
            icon: Star,
            title: 'Operation: Starred Assets',
            description: "Review high-value intel you've personally marked.",
            children: <Button className="w-full" asChild><Link href={`/decks/${deckId}/study/starred`}>Review Starred</Link></Button>,
        },
        {
            id: 'timed',
            icon: Timer,
            title: 'Operation: Timed Drill',
            description: 'A high-pressure speed trial. Answer before the clock runs out.',
            children: <Button className="w-full" asChild><Link href={`/decks/${deckId}/study/timed`}>Start Drill</Link></Button>,
        },
        {
            id: 'level-up',
            icon: BookOpen,
            title: 'Operation: Level Up',
            description: 'Advance your clearance one cognitive level at a time.',
            children: <Button className="w-full" asChild><Link href={`/decks/${deckId}/study/level-up`}>Enter Level-Up</Link></Button>,
        },
        {
            id: 'topic-trek',
            icon: Rocket,
            title: 'Operation: Topic Trek',
            description: 'Infiltrate specific subjects by topic tag.',
            children: <Button className="w-full" asChild><Link href={`/decks/${deckId}/study/topic-trek`}>Explore Topics</Link></Button>,
        },
    ];

    return (
        <main className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto max-w-4xl p-4 py-8">
                <section className="text-center mb-8">
                    <Briefcase className="h-10 w-10 mx-auto text-primary mb-2" />
                    <h1 className="text-3xl font-bold">Agent Briefing</h1>
                    <p className="text-muted-foreground mt-1">
                        Agent, your dossier for <span className="font-semibold text-primary">{deck.title}</span> is ready. Select your assignment.
                    </p>
                     <div className="max-w-md mx-auto mt-4 bg-white p-3 rounded-lg border">
                        <div className="flex justify-between items-center text-sm font-medium mb-1">
                            <span>Deck Level: {deckLevel}</span>
                            <span>{deckXp} / {deckXpToNext} XP</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="h-2 bg-primary rounded-full"
                          />
                        </div>
                    </div>
                </section>

                <DebriefBanner recommendation="We recommend you finish the Quest to tailor the rest of your tasks." />
                
                 <motion.div
                    variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    style={{ perspective: 1000 }}
                 >
                    {missions.map(m => (
                        <motion.div
                            key={m.id}
                            variants={{ hidden:{opacity:0,y:8}, show:{opacity:1,y:0} }}
                        >
                            <MissionCard
                                icon={m.icon}
                                title={m.title}
                                description={m.description}
                            >
                                {m.children}
                            </MissionCard>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </main>
    )
}
