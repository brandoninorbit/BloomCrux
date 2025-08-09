'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import type { Deck, Flashcard } from '@/stitch/types';
import { getTopics } from '@/lib/firestore';
import { Loader2, Map } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { StudyCard } from '@/components/StudyCard'; // Reusing a simplified StudyCard

export default function TopicTrekPage() {
    const params = useParams();
    const router = useRouter();
    const { deckId } = params as { deckId: string };
    const { user } = useUserAuth();

    const [deck, setDeck] = useState<Deck | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    useEffect(() => {
        const fetchDeck = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const topics = await getTopics(user.uid);
                const foundDeck = topics.flatMap(t => t.decks).find(d => d.id === deckId);
                if (foundDeck) {
                    setDeck(foundDeck);
                } else {
                    router.push('/decks');
                }
            } catch (error) {
                console.error("Failed to fetch deck for Topic Trek:", error);
                router.push('/decks');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDeck();
    }, [user, deckId, router]);

    const availableTopics = useMemo(() => {
        if (!deck) return [];
        const topics = new Set(deck.cards.map(c => c.subTopic).filter(Boolean));
        return Array.from(topics);
    }, [deck]);

    const filteredCards = useMemo(() => {
        if (!deck || !selectedTopic) return [];
        return deck.cards.filter(card => card.subTopic === selectedTopic);
    }, [deck, selectedTopic]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!deck) {
        return <p>Deck not found.</p>;
    }

    if (availableTopics.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Map />Topic Trek</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground p-8">
                    <p>This deck has no sub-topics assigned to its cards.</p>
                    <p className="text-sm mt-1">Edit your cards to add sub-topics to enable this mode.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Map />Topic Trek</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">Select a topic to focus your study session.</p>
                    <div className="flex flex-wrap gap-2">
                        {availableTopics.map(topic => (
                             <motion.button
                                key={topic}
                                className={cn(`px-3 py-1 text-sm rounded-full border`,
                                    selectedTopic === topic ? "bg-primary text-primary-foreground border-primary" : "bg-background"
                                )}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedTopic(topic)}
                              >
                                {topic}
                              </motion.button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div>
                <AnimatePresence>
                    {selectedTopic && (
                        <motion.div
                            key={selectedTopic} // Re-animate when topic changes
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <h2 className="text-xl font-semibold mb-4">Cards for: <span className="text-primary">{selectedTopic}</span></h2>

                            {filteredCards.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredCards.map((card, i) => (
                                     <motion.div
                                      key={card.id}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ delay: i * 0.05 }}
                                    >
                                        <Card className="h-full">
                                            <CardContent className="p-4 text-center flex items-center justify-center min-h-[100px]">
                                               <p className="font-medium">{card.questionStem}</p>
                                            </CardContent>
                                        </Card>
                                     </motion.div>
                                ))}
                                </div>
                            ) : (
                                <p>No cards found for this topic.</p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}