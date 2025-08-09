
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

// CSV PARSING HELPERS
const stripBOM = (s: string) => s.replace(/^\uFEFF/, '');
const asciiQuotes = (s: string) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');

const get = (row: any, ...names: string[]) => {
  for (const n of names) {
    const v = row[n]; // keys already lowercased by transformHeader
    if (v != null && String(v).trim() !== '') return String(v);
  }
  return '';
};

const normalizeBloom = (s: string): BloomLevel | null => {
  const m = s.trim().toLowerCase();
  if (m === 'remember') return 'Remember';
  if (m === 'understand') return 'Understand';
  if (m === 'apply') return 'Apply';
  if (m === 'analyze' || m === 'analyse') return 'Analyze';
  if (m === 'evaluate') return 'Evaluate';
  if (m === 'create') return 'Create';
  return null;
};

// find a bloom column even if it’s named weirdly
const pickBloomFromRow = (row: any): string => {
  const keys = Object.keys(row);
  // strong candidates first
  const exacts = [
    'bloom', "bloom's level", 'bloom’s level', 'bloom level',
    'bloomlevel', 'blooms level', 'bloomslevel', 'bloom taxonomy level'
  ];
  for (const k of exacts) if (row[k] != null && String(row[k]).trim() !== '') return String(row[k]);

  // fallback: any header containing "bloom"
  const loose = keys.find(k => k.includes('bloom'));
  return loose ? String(row[loose]) : '';
};

const DEFAULT_BLOOM_BY_FORMAT: Partial<Record<CardFormat, BloomLevel>> = {
  'Standard MCQ': 'Remember',
  'Two-Tier MCQ': 'Analyze',
  'Fill in the Blank': 'Remember',
  'Short Answer': 'Understand',
  'Compare/Contrast': 'Analyze',
  'Drag and Drop Sorting': 'Apply',
  'Sequencing': 'Apply',
  'CER': 'Evaluate',
};

// Function to transform a parsed CSV row into a Flashcard object
const transformRowToCard = (row: any): Flashcard | null => {
    // row.* keys are lowercase now
    const cardType = get(row, 'cardtype', 'card type', 'format', 'type') as CardFormat;
    if (!cardType) return null;

    let questionText = get(row, 'question', 'prompt', 'title', 'stem', 'question stem');

    // 1) Column value if present
    const csvBloomRaw = pickBloomFromRow(row);
    // 2) Bracket in the text (supports all six levels)
    const bracket = (questionText.match(/^\[(Remember|Understand|Apply|Analyze|Evaluate|Create)\]/i)?.[1] ?? '');

    const fromCsv     = normalizeBloom(csvBloomRaw);
    const fromBracket = normalizeBloom(bracket);
    const fromType    = DEFAULT_BLOOM_BY_FORMAT[cardType];
    const bloomLevel = (fromCsv ?? fromBracket ?? fromType ?? 'Remember') as BloomLevel;

    if (fromBracket) {
      questionText = questionText.replace(/^\[(Remember|Understand|Apply|Analyze|Evaluate|Create)\]\s*/i, '').trim();
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
            const optionsMCQ = [get(row,'a'), get(row,'b'), get(row,'c'), get(row,'d')].filter(Boolean);
            const answerMCQ = get(row, 'answer', 'correctanswer');
            return {
                ...baseCard,
                tier1: {
                    question: questionText,
                    options: optionsMCQ,
                    correctAnswerIndex: ['a', 'b', 'c', 'd'].indexOf(answerMCQ.toLowerCase()),
                    distractorRationale: { explanation: get(row, 'explanation', 'rationale') }
                }
            } as Flashcard;
        case 'Two-Tier MCQ':
             const answerT1 = get(row, 'answer', 'tier1answer');
             const answerT2 = get(row, 'tier2answer');
             return {
                ...baseCard,
                tier1: {
                    question: questionText,
                    options: [get(row, 'a'), get(row, 'b'), get(row, 'c'), get(row, 'd')].filter(Boolean),
                    correctAnswerIndex: ['a', 'b', 'c', 'd'].indexOf(answerT1.toLowerCase()),
                },
                tier2: {
                    question: get(row, 'tier2question'),
                    options: [get(row, 'tier2a'), get(row, 'tier2b'), get(row, 'tier2c'), get(row, 'tier2d')].filter(Boolean),
                    correctAnswerIndex: ['a', 'b', 'c', 'd'].indexOf(answerT2.toLowerCase()),
                }
            } as Flashcard;
        case 'Fill in the Blank':
            return {
                ...baseCard,
                prompt: questionText,
                correctAnswer: get(row, 'answer', 'correctanswer')
            } as Flashcard;
        case 'Short Answer':
            return {
                ...baseCard,
                prompt: questionText,
                suggestedAnswer: get(row, 'suggestedanswer', 'answer')
            } as Flashcard;
        case 'Compare/Contrast':
            return {
                ...baseCard,
                itemA: get(row, 'itema'),
                itemB: get(row, 'itemb'),
                pairs: (get(row, 'pairs')).split('|').map((p: string) => {
                    const [feature, pointA, pointB] = p.split(';');
                    return { feature, pointA, pointB };
                })
            } as Flashcard;
        case 'Drag and Drop Sorting':
            const items: DndItem[] = (get(row, 'items')).split('|').map((item: string) => {
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
            const seqItems = (get(row, 'items')).split('|');
            return {
                ...baseCard,
                prompt: questionText,
                items: seqItems,
                correctOrder: seqItems,
            } as Flashcard;
        case 'CER':
            const parts: CERPart[] = (get(row, 'parts')).split('|').map((partStr: string) => {
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
                prompt: get(row, 'scenario'),
                question: questionText,
                parts,
            } as Flashcard;
        default:
            return null;
    }
};

const getDisplayQuestion = (card: Flashcard) => {
  const stem = (card.questionStem ?? '').trim();
  if (stem) return stem;

  switch (card.cardFormat) {
    case 'Compare/Contrast':
      // if itemA/B exist, show a sensible label
      // @ts-ignore – if your type doesn’t include itemA/B, cast as any
      return `${(card as any).itemA ?? ''} vs ${(card as any).itemB ?? ''}`.trim() || 'Compare/Contrast';
    case 'Drag and Drop Sorting':
      // @ts-ignore
      return (card as any).prompt ?? (card as any).title ?? 'Drag and Drop';
    case 'Sequencing':
      // @ts-ignore
      return (card as any).prompt ?? 'Sequencing';
    case 'Fill in the Blank':
      // @ts-ignore
      return (card as any).prompt ?? 'Fill in the Blank';
    case 'CER':
      // @ts-ignore
      return (card as any).question ?? 'CER';
    default:
      return 'Untitled';
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
  const [sortOrder, setSortOrder] = useState<'default'|'bloom'|'format'|'source'>('default');

  useEffect(() => {
    const fetchDeckData = async () => {
      setLoading(true);

      const fixBloom = (s: any): BloomLevel | null => {
        if (!s) return null;
        const m = String(s).toLowerCase();
        if (m === 'remember') return 'Remember';
        if (m === 'understand') return 'Understand';
        if (m === 'apply') return 'Apply';
        if (m === 'analyze' || m === 'analyse') return 'Analyze';
        if (m === 'evaluate') return 'Evaluate';
        if (m === 'create') return 'Create';
        return null;
      };

      const migrateCards = (arr: Flashcard[] = []) =>
        arr.map(c => {
          const fromAny =
            fixBloom((c as any).bloomLevel) ??
            fixBloom((c as any).bloom) ??
            fixBloom((c as any).bloom_level) ??
            fixBloom((c as any).meta?.bloom);

          // last resort: bracket in questionStem
          const bracket = c.questionStem?.match(/^\[(Remember|Understand|Apply|Analyze|Evaluate|Create)\]/i)?.[1];
          const fromBracket = fixBloom(bracket);

          return {
            ...c,
            bloomLevel: (fromAny ?? fromBracket ?? 'Remember') as BloomLevel,
          };
        });

      if (!user) {
        // Mock data path for logged-out users
        const allMocks = [...MOCK_DECKS_RECENT, ...Object.values(MOCK_DECKS_BY_FOLDER).flat()];
        const mockDeck = allMocks.find(d => d.id === deckId);
        if (mockDeck) {
            const { cards: fetchedCards, ...deckData } = mockDeck;
            setDeck(deckData);
            setCards(migrateCards(fetchedCards || []));
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
          setCards(migrateCards(fetchedCards || [])); // Store cards separately
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

  useEffect(() => {
    const set1 = new Set((cards ?? []).map(c => c.bloomLevel ?? (c as any).bloom ?? (c as any).bloom_level ?? (c as any).meta?.bloom ?? '<<none>>'));
    console.debug('[BloomCrux] Unique Bloom values in deck:', Array.from(set1));
  }, [cards]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader(h) {
          return asciiQuotes(stripBOM(h)).trim().toLowerCase();
        },
        complete: (results) => {
            const first = (results.data as any[])[0] ?? {};
            console.debug('[headers]', Object.keys(first));

            const imported = (results.data as any[])
              .map(row => transformRowToCard(row))
              .filter((card): card is Flashcard => card !== null);
            
            console.table(imported.slice(0,10).map(c => ({ bloom: c.bloomLevel, type: c.cardFormat })));
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
    const norm = (s?: string | null) => (s ?? '').trim();
    const bloomTitle = (raw?: string) => {
      if (!raw) return 'Uncategorized';
      const x = raw.toLowerCase();
      const map: Record<string, BloomLevel | 'Uncategorized'> = {
        remember: 'Remember',
        understand: 'Understand',
        apply: 'Apply',
        analyze: 'Analyze',
        analyse: 'Analyze', // UK variant just in case
        evaluate: 'Evaluate',
        create: 'Create',
      };
      return map[x] ?? 'Uncategorized';
    };
  
    const getGroupKey = (card: Flashcard): string => {
      if (sortOrder === 'bloom') return bloomTitle(card.bloomLevel);
      if (sortOrder === 'format') return norm(card.cardFormat) || 'Uncategorized';
      if (sortOrder === 'source') return norm((card as any).source) || 'Unknown Source';
      return 'Default';
    };
  
    // Group
    const grouped = (cards ?? []).reduce((acc, c) => {
      const key = getGroupKey(c);
      (acc[key] ||= []).push(c);
      return acc;
    }, {} as Record<string, Flashcard[]>);
  
    // sort inside each group: by questionStem then id
    const sortCards = (arr: Flashcard[]) =>
      arr.sort((a, b) => {
        const A = norm(a.questionStem).toLowerCase();
        const B = norm(b.questionStem).toLowerCase();
        if (A < B) return -1;
        if (A > B) return 1;
        return norm(a.id).localeCompare(norm(b.id));
      });
  
    if (sortOrder === 'bloom') {
      const order: (BloomLevel | 'Uncategorized')[] = [
        'Remember','Understand','Apply','Analyze','Evaluate','Create','Uncategorized'
      ];
      const ordered: Record<string, Flashcard[]> = {};
      for (const k of order) if (grouped[k]) ordered[k] = sortCards(grouped[k]);
      for (const k of Object.keys(grouped)) if (!(k in ordered)) ordered[k] = sortCards(grouped[k]);
      return ordered;
    }
  
    if (sortOrder === 'format' || sortOrder === 'source') {
      const ordered: Record<string, Flashcard[]> = {};
      for (const k of Object.keys(grouped).sort((a,b)=>a.localeCompare(b))) {
        ordered[k] = sortCards(grouped[k]);
      }
      return ordered;
    }
  
    // default: single bucket, keep original order
    return { Default: cards ?? [] };
  }, [cards, sortOrder]);
  
  const bloomCounts = useMemo(() => {
    const counts = new Map<string, number>();
    (cards ?? []).forEach(c => {
        const key = (c.bloomLevel ?? 'Uncategorized').toString();
        counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries()); // e.g., [["Remember",16]]
  }, [cards]);

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
    if (sortOrder === 'bloom') {
        prefix = `[${card.bloomLevel}]`;
    } else if (sortOrder === 'format') {
        prefix = `[${card.cardFormat}]`;
    }
    
    // Remove the bracketed prefix from the question stem if it exists for display
    const displayQuestion = getDisplayQuestion(card)
      .replace(/^\[(Remember|Understand|Apply|Analyze|Evaluate|Create)\]\s*/i, '');

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
            <div>
              <h2 className="text-2xl font-bold">Cards in this Deck ({cards.length})</h2>
              <div className="text-sm text-muted-foreground">
                {bloomCounts.map(([k,v]) => <span key={k} className="mr-3">{k}: {v}</span>)}
              </div>
            </div>
            {cardsLoaded && (
                <div className="flex items-center gap-2">
                    <Label htmlFor="sort-order">Sort Cards By</Label>
                    <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
                        <SelectTrigger id="sort-order" className="w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="bloom">Bloom’s Level</SelectItem>
                            <SelectItem value="format">Card Format</SelectItem>
                            <SelectItem value="source">Source</SelectItem>
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
                        {sortOrder !== 'default' && groupCards.length > 0 && (
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
