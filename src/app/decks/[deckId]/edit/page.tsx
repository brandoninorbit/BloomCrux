
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import type { Deck, Flashcard } from '@/stitch/types';
import { getDeck, saveDeck } from '@/lib/firestore';
import { Loader2, PlusCircle, Star, Upload, Info, Trash2, FileText, Eye } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { MOCK_DECKS_BY_FOLDER, MOCK_DECKS_RECENT } from '@/mock/decks';

export default function EditDeckPage() {
  const { deckId } = useParams() as { deckId: string };
  const { user } = useUserAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] =useState(false);

  // State for lazy loading cards
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [isCardsLoading, setIsCardsLoading] = useState(false);

  useEffect(() => {
    const fetchDeckData = async () => {
      setLoading(true);
      if (!user) {
        // Mock data path for logged-out users
        const allMocks = [...MOCK_DECKS_RECENT, ...Object.values(MOCK_DECKS_BY_FOLDER).flat()];
        const mockDeck = allMocks.find(d => d.id === deckId);
        if (mockDeck) {
            const { cards: fetchedCards, ...deckData } = mockDeck;
            setDeck(deckData);
            setCards(fetchedCards || []);
            setTitle(mockDeck.title);
            setDescription(mockDeck.description);
        } else {
            setDeck({ id: 'mock-deck', title: 'Mock Deck Not Found', description: 'Please check the deck ID.', cards: [] });
            setTitle('Mock Deck Not Found');
            setDescription('Please check the deck ID.');
        }
        setLoading(false);
        return;
      }
      
      // Real data path for logged-in users
      try {
        const fetchedDeck = await getDeck(user.uid, deckId);
        if (fetchedDeck) {
          const { cards: fetchedCards, ...deckData } = fetchedDeck;
          setDeck(deckData); // Set deck metadata
          setCards(fetchedCards || []); // Store cards separately
          setTitle(deckData.title);
          setDescription(deckData.description);
        } else {
          toast({
            variant: "destructive",
            title: "Not Found",
            description: "Could not find the requested deck.",
          });
          router.push('/decks');
        }
      } catch (error) {
        console.error("Failed to fetch deck:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load your deck.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDeckData();
  }, [user, deckId, router, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // TODO: Handle file processing
    }
  };

  const handleSaveChanges = async () => {
    if (!user || !deck) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to save a deck.",
        });
        return;
    }
    setIsSaving(true);
    try {
        const updatedDeck: Deck = { ...deck, title, description, cards };
        await saveDeck(user.uid, updatedDeck);
        toast({
            title: "Success!",
            description: "Your deck has been updated.",
        });
        router.push('/decks');
    } catch (error) {
        console.error("Failed to save changes:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "An error occurred while saving your deck.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleLoadCards = () => {
    // In a real scenario, this would fetch cards if they weren't fetched initially.
    // For now, it just reveals the cards already in state.
    setIsCardsLoading(true);
    setTimeout(() => {
        setCardsLoaded(true);
        setIsCardsLoading(false);
    }, 500); // Simulate network delay
  }
  
  const starredCount = cards.filter(c => c.isStarred).length || 0;
  const mockSources = ["questions_batch1_fixed.csv", "questions_batch2_fixed.csv", "questions_batch3_fixed.csv"];

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
            <p>Deck not found.</p>
        </div>
    )
  }

  return (
    <main className="container mx-auto max-w-4xl p-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Deck</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes to Deck
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Editing Deck: <span className="text-primary">{deck.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deck-title">Deck Title</Label>
              <Input
                id="deck-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deck-description">Description</Label>
              <Textarea
                id="deck-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Deck Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Card
                </Button>
                <Button variant="outline" asChild>
                    <Link href={`/decks/${deck.id}/study/starred`}>
                        <Star className="mr-2 h-4 w-4" />
                        Study {starredCount} Starred
                    </Link>
                </Button>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Import From CSV</CardTitle>
                 <Button variant="outline" size="sm">
                    <Info className="mr-2 h-4 w-4" />
                    Instructions
                </Button>
            </CardHeader>
             <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV with a `CardType` column. Supported types: 'Standard MCQ`, `Two-Tier MCQ', 'Fill in the Blank', 'Short Answer", "Compare/Contrast, Drag and Drop Sorting', 'Sequencing', 'CER".
                </p>
                 <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload CSV
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv"
                        onChange={handleFileChange}
                    />
                    <span className="text-sm text-muted-foreground">{fileName || 'No file chosen.'}</span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Deck Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">This deck contains cards imported from the following files.</p>
                {mockSources.map((source, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <span className="font-medium">{source}</span>
                        </div>
                        <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>

        <h2 className="text-2xl font-bold">Cards in this Deck</h2>
        
        {!cardsLoaded ? (
            <Card className="text-center">
                <CardContent className="p-6">
                     <Button onClick={handleLoadCards} disabled={isCardsLoading}>
                        {isCardsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Load Cards ({cards.length})
                    </Button>
                </CardContent>
            </Card>
        ) : (
            cards.map(card => (
                 <Card key={card.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{card.questionStem}</p>
                            <p className="text-sm text-muted-foreground">{card.cardFormat}</p>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon"><Star className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    </CardContent>
                </Card>
            ))
        )}

      </div>
    </main>
  );
}
