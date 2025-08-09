
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import type { Deck } from '@/stitch/types';
import { getDeck, saveDeck } from '@/lib/firestore';
import { Loader2, PlusCircle, Star, Upload, Info, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchDeckData = async () => {
      if (!user) {
        // If not logged in, show mock data for layout purposes
        setDeck({ id: 'mock-deck', title: 'Lec 02 + 03 MBB343', description: 'Lecture 2 and 3 genetic engineering course', cards: [] });
        setTitle('Lec 02 + 03 MBB343');
        setDescription('Lecture 2 and 3 genetic engineering course');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedDeck = await getDeck(user.uid, deckId);
        if (fetchedDeck) {
          setDeck(fetchedDeck);
          setTitle(fetchedDeck.title);
          setDescription(fetchedDeck.description);
        } else {
          // Handle deck not found
          router.push('/decks');
        }
      } catch (error) {
        console.error("Failed to fetch deck:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeckData();
  }, [user, deckId, router]);

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
        const updatedDeck: Deck = { ...deck, title, description };
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
  
  const starredCount = deck?.cards.filter(c => c.isStarred).length || 5; // using 5 as mock fallback

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

        <h2 className="text-2xl font-bold">Cards in this Deck</h2>

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

      </div>
    </main>
  );
}
