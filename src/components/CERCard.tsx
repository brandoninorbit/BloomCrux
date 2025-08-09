
"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import type { CERCard as CERCardType, CERPart } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// Helper to shuffle an array
const shuffle = <T,>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};


export default function CERCard({ card, onLog }: { card: CERCardType, onLog: (wasCorrect: boolean) => void }) {
  const parts = Array.isArray(card.parts) ? card.parts : [];
  const hasAnyMcq = parts.some(p => p.inputType === 'mcq'); parts.some(p => p.inputType === 'mcq');

    const [mode, setMode] = useState<'mcq' | 'text'>(hasAnyMcq ? 'mcq' : 'text');
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [override, setOverride] = useState(false);
    
    // Memoize the shuffled options so they don't change on re-renders
    const shuffledMcqParts = useMemo(() => {
        return parts.map(part => {
            if (part.inputType === 'mcq' && part.options) {
                return { ...part, options: shuffle(part.options) };
            }
            return part;
        });
    }, [parts]);


    const isComplete = parts.every(part => !!answers[part.key]?.trim());
    const isTextMode = parts.every(p => p.inputType === 'text');

    const handleAnswerChange = (key: string, value: string) => {
        setAnswers(prev => ({...prev, [key]: value}));
    }

    const handleSubmit = () => {
        setSubmitted(true);
        if(isTextMode) return; // For free-text, log is handled by override
        
        let correct = true;
        parts.forEach(part => {
            if (part.inputType === 'mcq') {
                const selectedOption = answers[part.key];
                const correctOption = part.options?.[part.correctIndex || 0];
                if (selectedOption !== correctOption) {
                    correct = false;
                }
            }
        });
        onLog(correct);
    };

    useEffect(() => {
        if (submitted && override) onLog(true);
    }, [submitted, override, onLog]);

    const getPartCorrectness = (partKey: 'claim' | 'evidence' | 'reasoning') => {
        if (!submitted) return 'neutral';
        const part = parts.find(p => p.key === partKey);
        if (!part || part.inputType !== 'mcq') return 'neutral';

        const selected = answers[partKey];
        const correct = part.options?.[part.correctIndex || 0];
        return selected === correct ? 'correct' : 'incorrect';
    }

    return (
    <div className="w-full text-left space-y-4">
        <Card className="p-4 bg-muted/50 mb-4">
            <CardHeader className="p-2"><CardTitle className="text-lg">Scenario</CardTitle></CardHeader>
            <CardContent className="p-2">
                <p>{card.prompt}</p>
            </CardContent>
        </Card>
        <p className="text-xl font-semibold mb-4 text-center">{card.question}</p>
        
        {hasAnyMcq && !isTextMode && !submitted && (
            <RadioGroup defaultValue="mcq" onValueChange={(v) => setMode(v as 'mcq' | 'text')} className="flex justify-center gap-4 mb-4">
                 <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mcq" id="mode-mcq" />
                    <Label htmlFor="mode-mcq">Multiple Choice</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="mode-text" />
                    <Label htmlFor="mode-text">Free Text</Label>
                </div>
            </RadioGroup>
        )}

        {shuffledMcqParts.map((part, index) => {
            const originalPart = parts[index]; // Use original part for correct answer checking
            const partCorrectness = getPartCorrectness(part.key);

            return (
            <div key={part.key}>
                <Label htmlFor={part.key} className="text-base font-semibold capitalize">{part.key}</Label>
                {(mode === 'mcq' && part.inputType === 'mcq') ? (
                    <Select
                        disabled={submitted}
                        onValueChange={(v) => handleAnswerChange(part.key, v)}
                        value={answers[part.key] || ""}
                    >
                        <SelectTrigger id={part.key} className={
                            partCorrectness === 'correct' ? 'border-green-500' : 
                            partCorrectness === 'incorrect' ? 'border-red-500' : ''
                        }>
                            <SelectValue placeholder={`Choose a ${part.key}...`} />
                        </SelectTrigger>
                        <SelectContent>
                            {(part.options || []).map((opt: string) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <Textarea
                        id={part.key}
                        disabled={submitted}
                        className="mt-1"
                        rows={2}
                        onChange={e => handleAnswerChange(part.key, e.target.value)}
                        value={answers[part.key] || ""}
                     />
                )}
                 {submitted && part.inputType === 'text' && (
                     <Card className="w-full bg-muted/50 p-3 mt-2">
                        <CardHeader className="p-0"><CardTitle className="text-sm font-semibold">Sample Answer</CardTitle></CardHeader>
                        <CardContent className="p-0 pt-1 text-sm">{part.sampleAnswer}</CardContent>
                     </Card>
                 )}
                 {partCorrectness === 'incorrect' && (
                    <p className="text-sm text-green-600 mt-1">Correct Answer: {originalPart.options?.[originalPart.correctIndex || 0]}</p>
                 )}
            </div>
        )})}
        

        <div className="text-center pt-4">
            {!submitted ? (
                <Button
                    onClick={handleSubmit}
                    disabled={!isComplete}
                >
                    Submit
                </Button>
            ) : (
                <div className="space-y-3">
                    {mode === 'mcq' ? (
                       <p className={`font-semibold text-lg ${
                            parts.every(p => getPartCorrectness(p.key) !== 'incorrect')
                            ? 'text-green-600' : 'text-red-600'
                       }`}>
                           {parts.every(p => getPartCorrectness(p.key) !== 'incorrect')
                            ? "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ All correct!" : "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ Some parts were incorrect."}
                       </p>
                    ) : (
                        <div>
                            <div className="items-top flex space-x-2 justify-center">
                                <Checkbox id="override" checked={override} onCheckedChange={(c) => setOverride(Boolean(c))} />
                                <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="override" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Mark as correct
                                </Label>
                                <p className="text-sm text-muted-foreground">My answer was substantially correct.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
}


