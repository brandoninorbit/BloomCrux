
'use client';

import { useState } from 'react';
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
import type { Flashcard, StandardMCQCard, CardFormat } from '@/stitch/types';

interface CreateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newCard: Flashcard) => void;
}

export default function CreateCardDialog({ open, onOpenChange, onSave }: CreateCardDialogProps) {
  const [questionStem, setQuestionStem] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [cardType, setCardType] = useState<CardFormat>('Standard MCQ');
  
  const handleSave = () => {
    // Basic validation
    if (!questionStem.trim() || options.some(opt => !opt.trim())) {
      alert('Please fill in all fields.');
      return;
    }
    
    const newCard: StandardMCQCard = {
      id: crypto.randomUUID(),
      cardFormat: 'Standard MCQ',
      questionStem,
      topic: 'Manual', // Default topic
      bloomLevel: 'Remember', // Default Bloom's level
      tier1: {
        question: questionStem,
        options,
        correctAnswerIndex,
        distractorRationale: {
          explanation: explanation,
        },
      },
    };

    onSave(newCard);
    // Reset form for next time
    setQuestionStem('');
    setOptions(['', '', '', '']);
    setCorrectAnswerIndex(0);
    setExplanation('');
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add a New Card</DialogTitle>
          <DialogDescription>
            Select a card type and fill in the details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="question-type" className="text-right">
              Question Type
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
                  <SelectItem value="Fill in the Blank" disabled>Fill in the Blank</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2">
                    <span className="text-lg">🔧</span> Apply / Analyze
                  </SelectLabel>
                  <SelectItem value="Short Answer" disabled>Short Answer</SelectItem>
                  <SelectItem value="Compare/Contrast" disabled>Compare/Contrast</SelectItem>
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
                  <SelectItem key={i} value={String(i)}>Option {String.fromCharCode(65 + i)}</SelectItem>
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
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>Save Card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
