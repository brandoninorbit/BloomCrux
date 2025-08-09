
'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserAuth } from "@/context/AuthContext";
import { getOrCreateRemixSession, advanceRemix } from "@/lib/remix";
import { getAllCardsForDeck, getCardById, logCardAttempt } from "@/lib/firestore";
import type { Flashcard } from "@/types";
import { StudyMissionLayout } from "@/components/StudyMissionLayout";
import { StudyCard } from "@/components/StudyCard";
import { Loader2, PartyPopper } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RandomRemixPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const { user } = useUserAuth();
  const [session, setSession] = useState<any>(null);
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user?.uid || !deckId) {
      setLoading(false);
      return;
    };
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const s = await getOrCreateRemixSession({
          uid: user.uid,
          deckId,
          fetchAllCardsInDeck: (id) => getAllCardsForDeck(user.uid, id)
        });
        
        if(s.currentIndex >= s.order.length) {
            setSession(s);
            setCurrentCard(null);
            setLoading(false);
            return;
        }

        const currentId = s.order[s.currentIndex];
        const c = currentId ? await getCardById(user.uid, deckId, currentId) : null;
        if (!cancelled) {
          setSession(s);
          setCurrentCard(c);
        }
      } catch (error) {
          console.error("Failed to load remix session", error);
          router.push(`/decks/${deckId}/study`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.uid, deckId, router]);

  const percent = useMemo(() => {
    if (!session?.totalCards || session.totalCards === 0) return 0;
    return Math.floor(100 * (session.currentIndex) / session.totalCards);
  }, [session]);

  const handleNextCard = async () => {
    if (!user?.uid || !session) return;
    setChecking(true);
    await advanceRemix(user.uid, deckId as string);

    // Refresh local view
    const s = await getOrCreateRemixSession({
      uid: user.uid,
      deckId: deckId as string,
      fetchAllCardsInDeck: (id) => getAllCardsForDeck(user.uid, id)
    });
    
    if (s.currentIndex >= s.order.length) {
        setSession(s);
        setCurrentCard(null);
        setChecking(false);
        return;
    }

    const currentId = s.order[s.currentIndex];
    const c = currentId ? await getCardById(user.uid, deckId, currentId) : null;

    setSession(s);
    setCurrentCard(c);
    setChecking(false);
  };
  
  const handleLogAttempt = (card: Flashcard, wasCorrect: boolean) => {
    if (user) {
        logCardAttempt(user.uid, {
            deckId: deckId,
            cardId: String(card.id),
            bloomLevel: card.bloomLevel,
            wasCorrect: wasCorrect,
            timestamp: new Date()
        });
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentCard) {
    return (
       <main className="container mx-auto max-w-2xl p-4 py-8 text-center">
         <Card className="p-8">
            <CardHeader>
                <PartyPopper className="h-16 w-16 text-primary mx-auto" />
                <CardTitle className="text-3xl font-bold mt-4">Remix Complete!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">You've finished this randomized session. Great work.</p>
                <div className="flex justify-center gap-4">
                    <Button asChild>
                        <Link href={`/decks/${deckId}/study`}>Back to Missions</Link>
                    </Button>
                </div>
            </CardContent>
         </Card>
       </main>
    );
  }

  return (
    <StudyMissionLayout
        deckTitle={session?.deckTitle || "Random Remix"}
        progress={percent}
        tokens={0}
        powerUpsExpanded={false}
        setPowerUpsExpanded={() => {}}
        onUsePowerUp={() => {}}
        purchaseCounts={{}}
    >
       <main className="w-full">
            <StudyCard
                card={currentCard}
                onLogAttempt={handleLogAttempt}
                onNextCard={handleNextCard}
                deckId={deckId}
                isRetryArmed={false}
                onUseRetry={() => {}}
            />
       </main>
    </StudyMissionLayout>
  );
}
