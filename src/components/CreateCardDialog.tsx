
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Flashcard, StandardMCQCard, CardFormat, FillInTheBlankCard, ShortAnswerCard, BloomLevel, CompareContrastCard } from '@/stitch/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Info, PlusCircle, Trash2 } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface CreateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newCard: Flashcard) => void;
}

const DEFAULT_BLOOM_BY_FORMAT: Record<CardFormat, BloomLevel> = {
  'Standard MCQ': 'Remember',
  'Fill in the Blank': 'Remember',
  'Short Answer': 'Understand',
  'Compare/Contrast': 'Analyze',
  'Drag and Drop Sorting': 'Apply',
  'Sequencing': 'Apply',
  'Two-Tier MCQ': 'Analyze',
  'CER': 'Evaluate',
  'text': 'Remember',
  'code': 'Apply',
  'other': 'Remember',
};

const BLOOM_LEVELS: BloomLevel[] = [ "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create" ];


export default function CreateCardDialog({ open, onOpenChange, onSave }: CreateCardDialogProps) {
  const [cardType, setCardType] = useState<CardFormat>('Standard MCQ');
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>('Remember');
  
  // MCQ State
  const [questionStem, setQuestionStem] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [explanation, setExplanation] = useState('');

  // Text-based State
  const [prompt, setPrompt] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [suggestedAnswer, setSuggestedAnswer] = useState('');

  // Compare/Contrast State
  const [itemA, setItemA] = useState('');
  const [itemB, setItemB] = useState('');
  const [comparisonPairs, setComparisonPairs] = useState([{ feature: '', pointA: '', pointB: '' }]);
  
  useEffect(() => {
    // When card type changes, update the default bloom level
    setBloomLevel(DEFAULT_BLOOM_BY_FORMAT[cardType] || 'Remember');
  }, [cardType]);

  const resetForm = () => {
    setQuestionStem('');
    setOptions(['', '', '', '']);
    setCorrectAnswerIndex(0);
    setExplanation('');
    setPrompt('');
    setCorrectAnswer('');
    setSuggestedAnswer('');
    setItemA('');
    setItemB('');
    setComparisonPairs([{ feature: '', pointA: '', pointB: '' }]);
  };

  const handleSave = () => {
    let newCard: Flashcard;

    switch (cardType) {
        case 'Standard MCQ':
            if (!questionStem.trim() || options.some(opt => !opt.trim())) {
                alert('Please fill in all fields for the MCQ card.');
                return;
            }
            newCard = {
                id: crypto.randomUUID(),
                cardFormat: 'Standard MCQ',
                questionStem,
                topic: 'Manual',
                bloomLevel,
                tier1: {
                question: questionStem,
                options,
                correctAnswerIndex,
                distractorRationale: { explanation },
                },
            } as StandardMCQCard;
            break;

        case 'Fill in the Blank':
            if (!prompt.trim() || !correctAnswer.trim()) {
                alert('Please fill in the prompt and correct answer.');
                return;
            }
            newCard = {
                id: crypto.randomUUID(),
                cardFormat: 'Fill in the Blank',
                questionStem: prompt,
                prompt: prompt,
                correctAnswer: correctAnswer,
                topic: 'Manual',
                bloomLevel,
            } as FillInTheBlankCard;
            break;

        case 'Short Answer':
            if (!prompt.trim() || !suggestedAnswer.trim()) {
                alert('Please fill in the prompt and suggested answer.');
                return;
            }
             newCard = {
                id: crypto.randomUUID(),
                cardFormat: 'Short Answer',
                questionStem: prompt,
                prompt: prompt,
                suggestedAnswer: suggestedAnswer,
                topic: 'Manual',
                bloomLevel,
            } as ShortAnswerCard;
            break;

        case 'Compare/Contrast':
            if (!itemA.trim() || !itemB.trim() || comparisonPairs.some(p => !p.feature.trim() || !p.pointA.trim() || !p.pointB.trim())) {
                alert('Please fill out both items and all comparison point fields.');
                return;
            }
            newCard = {
                id: crypto.randomUUID(),
                cardFormat: 'Compare/Contrast',
                questionStem: `Compare ${itemA} and ${itemB}`,
                topic: 'Manual',
                bloomLevel,
                itemA,
                itemB,
                pairs: comparisonPairs,
            } as CompareContrastCard;
            break;
            
        default:
            alert("This card type hasn't been implemented yet.");
            return;
    }


    onSave(newCard);
    resetForm();
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  
  const handlePairChange = (index: number, field: 'feature' | 'pointA' | 'pointB', value: string) => {
    const newPairs = [...comparisonPairs];
    newPairs[index][field] = value;
    setComparisonPairs(newPairs);
  };

  const addPair = () => {
    setComparisonPairs([...comparisonPairs, { feature: '', pointA: '', pointB: '' }]);
  };

  const removePair = (index: number) => {
    const newPairs = comparisonPairs.filter((_, i) => i !== index);
    setComparisonPairs(newPairs);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[625px] transition-all duration-300",
        cardType === 'Compare/Contrast' && "sm:max-w-4xl"
      )}>
        <DialogHeader>
          <DialogTitle>Add a New Card</DialogTitle>
          <DialogDescription>
            Select a card type and fill in the details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className={cn("grid gap-4 py-4", cardType === 'Compare/Contrast' && "grid-cols-2")}>
          <div className={cn("space-y-4", cardType === 'Compare/Contrast' && "pr-8 border-r")}>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="question-type" className="text-right">
                  Card Type
                </Label>
                <Select value={cardType} onValueChange={(v) => setCardType(v as CardFormat)}>
                  <SelectTrigger id="question-type" className="col-span-3">
                    <SelectValue placeholder="Select a question type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-2">
                        <span className="text-lg">🌱</span> Remember / Understand
                      </SelectLabel>
                      <SelectItem value="Standard MCQ">Standard Multiple Choice</SelectItem>
                      <SelectItem value="Fill in the Blank">Fill in the Blank</SelectItem>
                      <SelectItem value="Short Answer">Short Answer</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-2">
                        <span className="text-lg">🔧</span> Apply / Analyze
                      </SelectLabel>
                      <SelectItem value="Compare/Contrast">Compare/Contrast</SelectItem>
                      <SelectItem value="Drag and Drop Sorting" disabled>Drag & Drop Sorting</SelectItem>
                      <SelectItem value="Sequencing" disabled>Sequencing</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="flex items-center gap-2">
                        <span className="text-lg">🧪</span> Evaluate / Create
                      </SelectLabel>
                      <SelectItem value="Two-Tier MCQ" disabled>Two-Tier MCQ</SelectItem>
                      <SelectItem value="CER" disabled>Claim-Evidence-Reasoning</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bloom-level" className="text-right">
                  Bloom's Level
                </Label>
                <Select value={bloomLevel} onValueChange={(v) => setBloomLevel(v as BloomLevel)}>
                  <SelectTrigger id="bloom-level" className="col-span-3">
                    <SelectValue placeholder="Select a Bloom's level" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOM_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cardType === 'Standard MCQ' && (
                <>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="question-stem" className="text-right pt-2">
                      Question Stem
                    </Label>
                    <Textarea
                      id="question-stem"
                      value={questionStem}
                      onChange={(e) => setQuestionStem(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  {options.map((option, index) => (
                    <div key={index} className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`option-${index}`} className="text-right">
                        Option {String.fromCharCode(65 + index)}
                      </Label>
                      <Input
                        id={`option-${index}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="correct-answer" className="text-right">
                      Correct Answer
                    </Label>
                    <Select value={String(correctAnswerIndex)} onValueChange={(value) => setCorrectAnswerIndex(Number(value))}>
                      <SelectTrigger id="correct-answer" className="col-span-3">
                        <SelectValue placeholder="Select the correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((opt, i) => (
                          <SelectItem key={i} value={String(i)} disabled={!opt.trim()}>
                            Option {String.fromCharCode(65 + i)}: {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="explanation" className="text-right pt-2">
                      Explanation
                    </Label>
                    <Textarea
                      id="explanation"
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </>
              )}

              {cardType === 'Fill in the Blank' && (
                <>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="prompt-fitb" className="text-right pt-2">
                      Prompt
                      <span className="block text-xs text-muted-foreground">(use ___ for the blank)</span>
                    </Label>
                    <Textarea
                      id="prompt-fitb"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="col-span-3"
                      placeholder="The powerhouse of the cell is the ___."
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="correct-answer-fitb" className="text-right">
                      Correct Answer
                    </Label>
                    <Input
                      id="correct-answer-fitb"
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(e.target.value)}
                      className="col-span-3"
                      placeholder="Mitochondria"
                    />
                  </div>
                </>
              )}
              
              {cardType === 'Short Answer' && (
                <>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="prompt-sa" className="text-right pt-2">
                      Prompt/Question
                    </Label>
                    <Textarea
                      id="prompt-sa"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="col-span-3"
                      placeholder="Explain the process of photosynthesis in your own words."
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="suggested-answer-sa" className="text-right pt-2">
                      Suggested Answer
                    </Label>
                    <Textarea
                      id="suggested-answer-sa"
                      value={suggestedAnswer}
                      onChange={(e) => setSuggestedAnswer(e.target.value)}
                      className="col-span-3"
                      placeholder="A good answer would mention reactants (CO2, water, light), products (glucose, oxygen), and the location (chloroplasts)."
                    />
                  </div>
                </>
              )}
              
              {cardType === 'Compare/Contrast' && (
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="itemA">Item A</Label>
                        <Input id="itemA" value={itemA} onChange={e => setItemA(e.target.value)} placeholder="e.g., Mitosis" />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="itemB">Item B</Label>
                        <Input id="itemB" value={itemB} onChange={e => setItemB(e.target.value)} placeholder="e.g., Meiosis" />
                    </div>
                    
                    <div className="space-y-4">
                        <Label>Comparison Points</Label>
                        {comparisonPairs.map((pair, index) => (
                           <Card key={index} className="p-4 bg-muted/50 relative">
                                <div className="space-y-2">
                                    <Label htmlFor={`feature-${index}`}>Feature</Label>
                                    <Input id={`feature-${index}`} value={pair.feature} onChange={e => handlePairChange(index, 'feature', e.target.value)} placeholder="e.g., Purpose"/>
                                    
                                    <Label htmlFor={`pointA-${index}`}>Point for {itemA || 'A'}</Label>
                                    <Textarea id={`pointA-${index}`} value={pair.pointA} onChange={e => handlePairChange(index, 'pointA', e.target.value)} placeholder="e.g., Cell proliferation, growth, repair" rows={2}/>

                                    <Label htmlFor={`pointB-${index}`}>Point for {itemB || 'B'}</Label>
                                    <Textarea id={`pointB-${index}`} value={pair.pointB} onChange={e => handlePairChange(index, 'pointB', e.target.value)} placeholder="e.g., Sexual reproduction to produce gametes" rows={2}/>
                                </div>
                                {comparisonPairs.length > 1 && (
                                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => removePair(index)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                )}
                           </Card>
                        ))}
                    </div>

                    <Button variant="outline" onClick={addPair}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Add Comparison Point
                    </Button>
                </div>
              )}
          </div>
          
          {cardType === 'Compare/Contrast' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Card Preview</h3>
              <Card className="p-4">
                <CardHeader className="p-2 text-center">
                    <CardTitle>Compare {itemA || 'Item A'} and {itemB || 'Item B'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Feature</TableHead>
                                <TableHead>{itemA || 'Item A'}</TableHead>
                                <TableHead>{itemB || 'Item B'}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {comparisonPairs.map((pair, index) => (
                                pair.feature && (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{pair.feature}</TableCell>
                                        <TableCell>{pair.pointA}</TableCell>
                                        <TableCell>{pair.pointB}</TableCell>
                                    </TableRow>
                                )
                            ))}
                             {comparisonPairs.every(p => !p.feature) && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">Preview will appear here.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>Save Card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
