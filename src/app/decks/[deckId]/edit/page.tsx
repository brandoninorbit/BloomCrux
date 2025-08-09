
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserAuth } from '@/app/Providers/AuthProvider';
import type { Deck, Flashcard, CardFormat, CERPart, DndItem, BloomLevel } from '@/stitch/types';
import { getDeck, saveDeck } from '@/lib/firestore';
import { Loader2, PlusCircle, Star, Upload, Info, Trash2, FileText, Eye, Edit } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { MOCK_DECKS_BY_FOLDER, MOCK_DECKS_RECENT } from '@/mock/decks';
import { cn } from '@/lib/utils';
import CsvImportGuide from '@/components/CsvImportGuide';
import Papa from 'papaparse';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Function to transform a parsed CSV row into a Flashcard object
const transformRowToCard = (row: any): Flashcard | null => {
    const cardType = row.CardType as CardFormat;
    if (!cardType) return null;

    let questionText = row.Question || row.Prompt || row.Title || '';
    let bloomLevel: BloomLevel = 'Remember'; // Default Bloom Level

    // Override Bloom's Level if specified in the question
    const bloomMatch = questionText.match(/^\[(Remember|Understand|Apply|Analyze|Evaluate|Create)\]/i);
    if (bloomMatch) {
        bloomLevel = bloomMatch[1] as BloomLevel;
        questionText = questionText.replace(bloomMatch[0], '').trim();
    }

    const baseCard: Partial<Flashcard> = {
        id: crypto.randomUUID(), // Generate a temporary unique ID
        questionStem: questionText,
        topic: 'Imported', // Default topic
        bloomLevel: bloomLevel,
        cardFormat: cardType,
        isStarred: false,
    };

    switch (cardType) {
        case 'Standard MCQ':
            return {
                ...baseCard,
                tier1: {
                    question: questionText,
                    options: [row.A, row.B, row.C, row.D].filter(Boolean),
                    correctAnswerIndex: ['A', 'B', 'C', 'D'].indexOf(row.Answer),
                    distractorRationale: { explanation: row.Explanation }
                }
            } as Flashcard;
        case 'Two-Tier MCQ':
             return {
                ...baseCard,
                tier1: {
                    question: questionText,
                    options: [row.A, row.B, row.C, row.D].filter(Boolean),
                    correctAnswerIndex: ['A', 'B', 'C', 'D'].indexOf(row.Answer),
                },
                tier2: {
                    question: row.Tier2Question,
                    options: [row.Tier2A, row.Tier2B, row.Tier2C, row.Tier2D].filter(Boolean),
                    correctAnswerIndex: ['A', 'B', 'C', 'D'].indexOf(row.Tier2Answer),
                }
            } as Flashcard;
        case 'Fill in the Blank':
            return {
                ...baseCard,
                prompt: questionText,
                correctAnswer: row.Answer
            } as Flashcard;
        case 'Short Answer':
            return {
                ...baseCard,
                prompt: questionText,
                suggestedAnswer: row.SuggestedAnswer
            } as Flashcard;
        case 'Compare/Contrast':
            return {
                ...baseCard,
                itemA: row.ItemA,
                itemB: row.ItemB,
                pairs: (row.Pairs || '').split('|').map((p: string) => {
                    const [feature, pointA, pointB] = p.split(';');
                    return { feature, pointA, pointB };
                })
            } as Flashcard;
        case 'Drag and Drop Sorting':
            const items: DndItem[] = (row.Items || '').split('|').map((item: string) => {
                const [term, correctCategory] = item.split(';');
                return { term, correctCategory };
            });
            const categories = Array.from(new Set(items.map(i => i.correctCategory)));
            return {
                ...baseCard,
                prompt: questionText,
                items,
                categories,
            } as Flashcard;
        case 'Sequencing':
            const seqItems = (row.Items || '').split('|');
            return {
                ...baseCard,
                prompt: questionText,
                items: seqItems,
                correctOrder: seqItems,
            } as Flashcard;
        case 'CER':
            const parts: CERPart[] = (row.Parts || '').split('|').map((partStr: string) => {
                const [key, type, ...rest] = partStr.split(';');
                if (type === 'text') {
                    return { key, inputType: 'text', sampleAnswer: rest[0] };
                } else if (type === 'mcq') {
                    const correctIndex = parseInt(rest.pop() || '0', 10);
                    return { key, inputType: 'mcq', options: rest, correctIndex };
                }
                return null;
            }).filter((p): p is CERPart => p !== null);

            return {
                ...baseCard,
                prompt: row.Scenario,
                question: questionText,
                parts,
            } as Flashcard;
        default:
            return null;
    }
};


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
  
  // State for imported cards
  const [newlyImportedCards, setNewlyImportedCards] = useState<Flashcard[]>([]);

  // State for deleting sources
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);

  // State for sorting
  const [sortOrder, setSortOrder] = useState('Default');

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
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            const imported = results.data
                .map(row => transformRowToCard(row))
                .filter((card): card is Flashcard => card !== null);
            
            setNewlyImportedCards(imported);

            if(imported.length > 0) {
                 toast({
                    title: "CSV Parsed!",
                    description: `Found ${imported.length} cards. Click "Add New Cards" to add them to your deck.`,
                 });
            } else {
                 toast({
                    variant: "destructive",
                    title: "Parsing Failed",
                    description: "Could not find any valid cards in the CSV. Please check the format.",
                 });
            }
        },
        error: (error) => {
            toast({ variant: "destructive", title: "Parsing Error", description: error.message });
        }
      });
    }
  };
  
  const handleAddImportedCards = () => {
    setCards(prev => [...prev, ...newlyImportedCards]);
    setNewlyImportedCards([]); // Clear the staging area
    setFileName(null);
    toast({
        title: "Cards Added!",
        description: "The new cards are now in your deck. Don't forget to save your changes.",
    });
    if (!cardsLoaded) {
        handleLoadCards(); // Automatically show the card list if it was hidden
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
            description: `The details for deck "${title}" have been updated.`,
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
  };

  const handleToggleStar = (cardId: string) => {
    setCards(currentCards =>
        currentCards.map(card =>
            card.id === cardId ? { ...card, isStarred: !card.isStarred } : card
        )
    );
  };
  
  const handleDeleteSource = (sourceName: string) => {
    if (!deck) return;
    // Note: This logic is a placeholder. A real implementation would need
    // to know which cards came from which source. For now, it just removes
    // the source from the UI list.
    const updatedSources = deck.sources?.filter(s => s !== sourceName) || [];
    setDeck(prevDeck => prevDeck ? { ...prevDeck, sources: updatedSources } : null);
    // You would also filter the `cards` state here if you had the source info on each card.
    // setCards(prev => prev.filter(c => c.source !== sourceName));
    toast({
        title: "Source Removed",
        description: `All cards from ${sourceName} have been removed from this deck. Save your changes to make it permanent.`
    });
    setSourceToDelete(null); // Close dialog
  }

  const groupedCards = useMemo(() => {
    if (!cards) return { Default: [] as Flashcard[] };
    if (sortOrder === 'Default') return { Default: cards };

    // Normalize helpers
    const bloomTitle = (s?: string) => {
        if (!s) return 'Uncategorized';
        const x = s.toLowerCase();
        const map: Record<string, BloomLevel> = {
        remember: 'Remember',
        understand: 'Understand',
        apply: 'Apply',
        analyze: 'Analyze',
        evaluate: 'Evaluate',
        create: 'Create',
        };
        return (map[x] ?? 'Uncategorized') as BloomLevel | 'Uncategorized';
    };

    const trimStr = (s?: string | null) =>
        (s ?? '').toString().trim();

    const getGroupKey = (card: Flashcard): string => {
        if (sortOrder === "Bloom's Level") return bloomTitle(card.bloomLevel);
        if (sortOrder === 'Card Format') return trimStr(card.cardFormat) || 'Uncategorized';
        if (sortOrder === 'Source') {
        // If you later add card.source, this will neatly group by it
        return trimStr((card as any).source) || 'Unknown Source';
        }
        return 'Uncategorized';
    };

    // Group
    const grouped = cards.reduce((acc, card) => {
        const key = getGroupKey(card);
        (acc[key] ||= []).push(card);
        return acc;
    }, {} as Record<string, Flashcard[]>);

    // Sort items within each group (by questionStem asc, then id)
    const sortCardsInPlace = (arr: Flashcard[]) =>
        arr.sort((a, b) => {
        const A = trimStr(a.questionStem).toLowerCase();
        const B = trimStr(b.questionStem).toLowerCase();
        if (A < B) return  -1;
        if (A > B) return  1;
        return trimStr(a.id).localeCompare(trimStr(b.id));
        });

    // Order the groups
    if (sortOrder === "Bloom's Level") {
        const bloomOrder: (BloomLevel | 'Uncategorized')[] = [
        'Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create', 'Uncategorized'
        ];
        const ordered: Record<string, Flashcard[]> = {};
        for (const key of bloomOrder) {
        if (grouped[key]) {
            ordered[key] = sortCardsInPlace(grouped[key]);
        }
        }
        // Any unexpected keys go after
        Object.keys(grouped).forEach(k => {
        if (!(k in ordered)) ordered[k] = sortCardsInPlace(grouped[k]);
        });
        return ordered;
    }

    if (sortOrder === 'Card Format' || sortOrder === 'Source') {
        const ordered: Record<string, Flashcard[]> = {};
        const keys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
        for (const k of keys) {
        ordered[k] = sortCardsInPlace(grouped[k]);
        }
        return ordered;
    }

    // Fallback
    Object.values(grouped).forEach(sortCardsInPlace);
    return grouped;
  }, [cards, sortOrder]);
  
  const starredCount = cards.filter(c => c.isStarred).length || 0;
  const mockSources = deck?.sources || ["questions_batch1_fixed.csv", "questions_batch2_fixed.csv", "questions_batch3_fixed.csv"];

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
  
  const renderCard = (card: Flashcard) => {
    let prefix = '';
    if (sortOrder === 'Bloom\'s Level') {
        prefix = `[${card.bloomLevel}]`;
    } else if (sortOrder === 'Card Format') {
        prefix = `[${card.cardFormat}]`;
    }
    
    // Remove the bracketed prefix from the question stem if it exists for display
    const displayQuestion = (card.questionStem || '').replace(/^\[(Remember|Understand|Apply|Analyze|Evaluate|Create)\]\s*/i, '');

    return (
        <Card key={card.id}>
            <CardContent className="p-4 flex justify-between items-center">
                <div>
                    <p className="font-semibold"><span className="text-muted-foreground mr-2">{prefix}</span>{displayQuestion}</p>
                    <p className="text-sm text-muted-foreground">{card.cardFormat}</p>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleToggleStar(card.id)}>
                        <Star className={cn("h-4 w-4", card.isStarred && "fill-yellow-400 text-yellow-500")} />
                    </Button>
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => { /* Placeholder for delete */ alert(`Delete ${card.id}`)}}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
  }


  return (
    <main className="container mx-auto max-w-4xl p-4 py-8">
      <AlertDialog open={!!sourceToDelete} onOpenChange={(isOpen) => !isOpen && setSourceToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Delete all cards from this source?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete all cards imported from <span className="font-semibold text-foreground">{sourceToDelete}</span>. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSourceToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => sourceToDelete && handleDeleteSource(sourceToDelete)}
                >
                    Delete Imported Cards
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
                 <CsvImportGuide />
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
                 {newlyImportedCards.length > 0 && (
                    <div className="mt-4">
                        <Button onClick={handleAddImportedCards}>
                            Add {newlyImportedCards.length} New Cards to Deck
                        </Button>
                    </div>
                )}
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
                         <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => setSourceToDelete(source)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </CardContent>
        </Card>

        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Cards in this Deck ({cards.length})</h2>
            {cardsLoaded && (
                <div className="flex items-center gap-2">
                    <Label htmlFor="sort-order">Sort Cards By</Label>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger id="sort-order" className="w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Default">Default</SelectItem>
                            <SelectItem value="Bloom's Level">Bloom's Level</SelectItem>
                            <SelectItem value="Card Format">Card Format</SelectItem>
                            <SelectItem value="Source">Source</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
        
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
             <div className="space-y-6">
                {Object.entries(groupedCards).map(([groupName, groupCards]) => (
                    <div key={groupName}>
                        {sortOrder !== 'Default' && groupCards.length > 0 && (
                            <h3 className="text-md font-semibold text-muted-foreground mb-3">
                                {groupName} ({groupCards.length})
                            </h3>
                        )}
                        <div className="space-y-2">
                           {groupCards.map(card => renderCard(card))}
                        </div>
                    </div>
                ))}
            </div>
        )}

      </div>
    </main>
  );
}
