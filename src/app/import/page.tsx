'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Flashcard } from '@/stitch/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Stub function for the actual import logic
async function importFlashcards(cards: Flashcard[]): Promise<void> {
  console.log('Importing flashcards:', cards);
  // In a real app, this would be an API call to your backend to save the cards.
  return new Promise((resolve) => setTimeout(resolve, 500));
}

export default function ImportPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedCards, setParsedCards] = useState<Flashcard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      setError('Textarea is empty. Please paste your flashcard JSON.');
      setParsedCards([]);
      return;
    }

    try {
      const cards: Flashcard[] = JSON.parse(jsonInput);
      // Basic validation
      if (!Array.isArray(cards)) {
        throw new Error('JSON data must be an array of flashcard objects.');
      }
      
      setError(null);
      setParsedCards(cards);
      
      await importFlashcards(cards);

      toast({
        title: 'Success!',
        description: `${cards.length} flashcards have been imported.`,
      });
    } catch (e: any) {
      setError(`Invalid JSON: ${e.message}`);
      setParsedCards([]);
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: 'Please check the JSON format and try again.',
      });
    }
  };

  return (
    <main className="container mx-auto max-w-4xl p-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bulk Import Flashcards</h1>
      <div className="space-y-6">
        <Textarea
          placeholder='Paste your flashcard JSON array here...'
          className="w-full h-48 p-4 border rounded-lg font-code"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleImport}>Import</Button>

        {parsedCards.length > 0 && (
           <Card>
            <CardHeader>
              <CardTitle>Preview ({parsedCards.length} cards)</CardTitle>
            </CardHeader>
             <CardContent>
               <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                 {parsedCards.map((card, index) => (
                   <li key={card.id || index}>{card.questionStem || (card as any).front || 'Untitled Card'}</li>
                 ))}
               </ul>
             </CardContent>
           </Card>
        )}
      </div>
    </main>
  );
}

