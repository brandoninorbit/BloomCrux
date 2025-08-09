

'use client';

import { useState, useEffect } from 'react';
import type {
  Flashcard,
  StandardMCQCard,
  CompareContrastCard,
  DragAndDropSortingCard,
  FillInTheBlankCard,
  ShortAnswerCard,
  TwoTierMCQCard,
  CERCard,
  SequencingCard as SequencingCardType
} from "@/types";
import { Button } from './ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import DragSortCard from '@/components/DragSortCard';
import SequencingCard from '@/components/SequencingCard';
import { default as CERStudyCard } from '@/components/CERCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';

interface StudyCardProps {
    card: Flashcard;
    deckId: string;
    onLogAttempt: (card: Flashcard, wasCorrect: boolean) => void;
    onNextCard: () => void;
    isAnswered?: boolean;
    isRetryArmed: boolean;
    onUseRetry: () => void;
    isXpBoosted?: boolean;
    disabledOptions?: number[];
}

export function StudyCard({ card, onLogAttempt, onNextCard, isAnswered: externalIsAnswered, isRetryArmed, onUseRetry, isXpBoosted, disabledOptions = [] }: StudyCardProps) {
  const { toast } = useToast();
  // MCQ State
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [tier1Answer, setTier1Answer] = useState<number | null>(null);
  const [tier2Answer, setTier2Answer] = useState<number | null>(null);

  // Compare/Contrast State
  const [compareContrastAnswers, setCompareContrastAnswers] = useState<Record<string, { a: string, b: string }>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [overriddenPairs, setOverriddenPairs] = useState<string[]>([]);

  // Text Input State (for Fill in the Blank / Short Answer)
  const [textInput, setTextInput] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean|null>(null);

  const isLocallyAnswered = selectedAnswer !== null || tier2Answer !== null || isSubmitted || isAnswerChecked;
  const isAnswered = externalIsAnswered || isLocallyAnswered;

  const resetStateForRetry = () => {
    setSelectedAnswer(null);
    setTier1Answer(null);
    setTier2Answer(null);
    // Don't reset text inputs or other interactive states, just the answer state
    setIsSubmitted(false);
    setIsAnswerChecked(false);
    setShowFeedback(false);
    setIsCorrect(null);
  }

  // Reset state when card changes
  useEffect(() => {
    setSelectedAnswer(null);
    setTier1Answer(null);
    setTier2Answer(null);
    setCompareContrastAnswers({});
    setIsSubmitted(false);
    setOverriddenPairs([]);
    setTextInput('');
    setIsAnswerChecked(false);
    setShowFeedback(false);
    setIsCorrect(null);
  }, [card.id]);

  const handleIncorrectAnswer = () => {
    if (isRetryArmed) {
      onUseRetry();
      toast({ title: "Retry Used!", description: "Your streak is safe. Try again!" });
      resetStateForRetry(); // Reset card to allow another attempt
      return; // Stop further processing
    }
    // If no retry, proceed as normal
    setIsCorrect(false);
    setShowFeedback(true);
    onLogAttempt(card, false);
  }

  const handleMcqSelect = (selectedIndex: number, correctIndex: number) => {
    if(isAnswered) return;
    const wasCorrect = selectedIndex === correctIndex;
    setSelectedAnswer(selectedIndex);

    if (wasCorrect) {
      setIsCorrect(true);
      setShowFeedback(true);
      onLogAttempt(card, true);
    } else {
      handleIncorrectAnswer();
    }
  }

  const handleTwoTierAnswer = (tier: 'tier1' | 'tier2', selectedIndex: number) => {
    if(isAnswered) return;
    if (tier === 'tier1') {
      setTier1Answer(selectedIndex);
    }
    if (tier === 'tier2' && tier1Answer !== null) {
      const cardData = card as TwoTierMCQCard;
      const wasCorrect = tier1Answer === cardData.tier1.correctAnswerIndex && selectedIndex === cardData.tier2.correctAnswerIndex;
      setTier2Answer(selectedIndex);
      if (wasCorrect) {
        setIsCorrect(true);
        setShowFeedback(true);
        onLogAttempt(card, true);
      } else {
        handleIncorrectAnswer();
      }
    }
  }

  const handleCheckTextAnswer = () => {
    if(isAnswered) return;
    const c = card as FillInTheBlankCard | ShortAnswerCard;
    const answer = c.cardFormat === 'Fill in the Blank' ? c.correctAnswer : c.suggestedAnswer;
    const wasCorrect = textInput.trim().toLowerCase() === answer.trim().toLowerCase();
    setIsAnswerChecked(true);
    
    if (wasCorrect) {
        setIsCorrect(true);
        setShowFeedback(true);
        onLogAttempt(card, true);
    } else {
        handleIncorrectAnswer();
    }
  }
  
  const handleSelfGrade = (selfAssessedCorrect: boolean) => {
    onLogAttempt(card, selfAssessedCorrect);
    setIsCorrect(selfAssessedCorrect); // Update visual feedback
    setShowFeedback(true); // Make sure feedback footer appears
  }

  const handleCompareContrastChange = (feature: string, item: 'a' | 'b', value: string) => {
    setCompareContrastAnswers(prev => ({
        ...prev,
        [feature]: {
            ...(prev[feature] || { a: '', b: '' }),
            [item]: value,
        }
    }));
  };

  const handleCompareContrastSubmit = () => {
    if(isSubmitted) return;
    setIsSubmitted(true); // Just show feedback, don't log yet.
    setShowFeedback(true);
  };
  
  const handleCompareContrastLog = () => {
    const ccCard = card as CompareContrastCard;
    const normalize = (s = '') => s.trim().toLowerCase();
    let correctCount = 0;
    
    ccCard.pairs.forEach((pair: { feature: string; pointA: string; pointB: string }) => {
      if (overriddenPairs.includes(pair.feature)) {
        correctCount++;
        return;
      }
      const userAnswerA = normalize(compareContrastAnswers[pair.feature]?.a);
      const correctAnswerA = normalize(pair.pointA);
      const userAnswerB = normalize(compareContrastAnswers[pair.feature]?.b);
      const correctAnswerB = normalize(pair.pointB);
      if (userAnswerA === correctAnswerA && userAnswerB === correctAnswerB) {
        correctCount++;
      }
    });
    
    const wasCorrect = (correctCount / ccCard.pairs.length) >= 0.8;
    setIsCorrect(wasCorrect);
    if(wasCorrect) {
        onLogAttempt(card, true);
    } else {
        // Use the main incorrect handler to check for retries
        handleIncorrectAnswer();
    }
    // This is now the final step, so move to the next card after logging
    // but only if we didn't just use a retry
    if (!isRetryArmed || wasCorrect) {
        onNextCard();
    }
  };


  const handleDragSortLog = (wasCorrect: boolean) => {
      setIsSubmitted(true);
      if(wasCorrect) {
        setIsCorrect(true);
        setShowFeedback(true);
        onLogAttempt(card, true);
      } else {
        handleIncorrectAnswer();
      }
  }
  
  const handleSequencingLog = (wasCorrect: boolean) => {
      setIsSubmitted(true);
      if(wasCorrect) {
        setIsCorrect(true);
        setShowFeedback(true);
        onLogAttempt(card, true);
      } else {
        handleIncorrectAnswer();
      }
  }
  
  const handleCERLog = (wasCorrect: boolean) => {
      setIsSubmitted(true);
      if(wasCorrect) {
        setIsCorrect(true);
        setShowFeedback(true);
        onLogAttempt(card, true);
      } else {
        handleIncorrectAnswer();
      }
  }

  const renderCardContent = () => {
    const cardContainerClasses = cn(
        "bg-white rounded-2xl shadow-lg p-8 text-center",
        isXpBoosted && "xp-boost-glow"
    );

    switch (card.cardFormat) {
      case 'Standard MCQ':
        const scard = card as StandardMCQCard;
        const correctAnswerIndex = scard.tier1.correctAnswerIndex;
        return (
          <div className={cardContainerClasses}>
            <h1 className="text-3xl font-bold text-gray-800 mb-8">{card.questionStem}</h1>
            <div className="grid grid-cols-2 gap-4 w-full">
              {scard.tier1.options.map((option: string, index: number) => {
                const isCorrectOption = index === correctAnswerIndex;
                const isSelectedOption = selectedAnswer === index;
                const isDisabled = disabledOptions.includes(index);
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleMcqSelect(index, correctAnswerIndex)}
                    className={cn(
                      "p-5 text-left rounded-xl border-2 transition-all duration-200",
                      isAnswered && isCorrectOption ? "border-green-400 bg-green-50"
                      : isAnswered && isSelectedOption && !isCorrectOption ? "border-red-400 bg-red-50"
                      : "bg-white border-gray-200 hover:border-indigo-500 hover:bg-indigo-50"
                    )}
                    disabled={isAnswered || isDisabled}
                    animate={isDisabled ? { opacity: 0.4, scale: 0.95 } : { opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </motion.button>
                );
              })}
            </div>
            {isAnswered && (
                 <motion.div initial={{opacity: 0, y: 10}} animate={{opacity:1, y: 0}} className="w-full bg-muted/50 p-4 mt-4 rounded-lg">
                    <h3 className="text-lg font-bold text-left mb-1">Explanation</h3>
                    <p className="text-sm text-left">{scard.tier1.distractorRationale?.explanation || "No explanation provided."}</p>
                </motion.div>
            )}
          </div>
        );
      case 'Fill in the Blank':
      case 'Short Answer':
          const textCard = card as FillInTheBlankCard | ShortAnswerCard;
          const answer = textCard.cardFormat === 'Fill in the Blank' ? textCard.correctAnswer : textCard.suggestedAnswer;
          
          return (
             <div className={cn(cardContainerClasses, "space-y-4")}>
                <h1 className="text-3xl font-bold text-gray-800">{textCard.prompt}</h1>
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your answer..."
                  disabled={isAnswered}
                  className="max-w-md mx-auto"
                  onKeyDown={(e) => { if(e.key === 'Enter' && !isAnswered) handleCheckTextAnswer() }}
                />
                 {!isAnswered && <Button onClick={handleCheckTextAnswer}>Check Answer</Button>}
                 
                 {isAnswered && !isCorrect && (
                    <div className="space-y-4">
                        <Card className="w-full max-w-md mx-auto bg-muted/50 p-4">
                            <CardHeader className="p-0 text-left">
                              <CardTitle className="text-sm font-semibold text-primary">Suggested Answer</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 text-left pt-1">
                                <p className="text-lg font-bold">{answer}</p>
                            </CardContent>
                        </Card>
                         <div className="flex justify-center gap-4 items-center">
                             <p>Did you get it right?</p>
                             <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleSelfGrade(false)}>
                                <X className="mr-2 h-4 w-4" /> No
                             </Button>
                             <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleSelfGrade(true)}>
                                <Check className="mr-2 h-4 w-4" /> Yes
                             </Button>
                          </div>
                    </div>
                 )}
             </div>
          );
      case 'Compare/Contrast':
        const ccCard = card as CompareContrastCard;
        const normalize = (s = '') => s.trim().toLowerCase();
        return (
            <div className={cn(cardContainerClasses, "w-full max-w-4xl")}>
                <h1 className="text-2xl font-bold text-gray-800 mb-6">{ccCard.questionStem}</h1>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/3">Feature</TableHead>
                            <TableHead className="w-1/3">{ccCard.itemA}</TableHead>
                            <TableHead className="w-1/3">{ccCard.itemB}</TableHead>
                            {isSubmitted && <TableHead className="w-[100px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ccCard.pairs.map((pair: { feature: string; pointA: string; pointB: string }) => {
                             const userAnswerA = normalize(compareContrastAnswers[pair.feature]?.a);
                             const correctAnswerA = normalize(pair.pointA);
                             const isCorrectA = userAnswerA === correctAnswerA || overriddenPairs.includes(pair.feature);
                             const userAnswerB = normalize(compareContrastAnswers[pair.feature]?.b);
                             const correctAnswerB = normalize(pair.pointB);
                             const isCorrectB = userAnswerB === correctAnswerB || overriddenPairs.includes(pair.feature);

                            return (
                                <TableRow key={pair.feature}>
                                    <TableCell className="font-semibold align-top">{pair.feature}</TableCell>
                                    <TableCell>
                                        <Textarea
                                            placeholder={`How does "${pair.feature}" relate to ${ccCard.itemA}?`}
                                            disabled={isSubmitted}
                                            value={compareContrastAnswers[pair.feature]?.a || ''}
                                            onChange={e => handleCompareContrastChange(pair.feature, 'a', e.target.value)}
                                            className={cn(isSubmitted && (isCorrectA ? 'border-green-500' : 'border-red-500'))}
                                        />
                                        {isSubmitted && !isCorrectA && <p className="text-xs text-green-600 mt-1">Correct: {pair.pointA}</p>}
                                    </TableCell>
                                    <TableCell>
                                         <Textarea
                                            placeholder={`How does "${pair.feature}" relate to ${ccCard.itemB}?`}
                                            disabled={isSubmitted}
                                            value={compareContrastAnswers[pair.feature]?.b || ''}
                                            onChange={e => handleCompareContrastChange(pair.feature, 'b', e.target.value)}
                                            className={cn(isSubmitted && (isCorrectB ? 'border-green-500' : 'border-red-500'))}
                                        />
                                        {isSubmitted && !isCorrectB && <p className="text-xs text-green-600 mt-1">Correct: {pair.pointB}</p>}
                                    </TableCell>
                                    {isSubmitted && (!isCorrectA || !isCorrectB) && !overriddenPairs.includes(pair.feature) && (
                                        <TableCell>
                                            <Button size="sm" variant="outline" onClick={() => setOverriddenPairs(prev => [...prev, pair.feature])}>
                                                Mark as Correct
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
                {!isSubmitted && (
                    <Button className="mt-6" onClick={handleCompareContrastSubmit}>Check Answers</Button>
                )}
            </div>
        );
      case 'Drag and Drop Sorting':
        return <div className={cn(isXpBoosted && "xp-boost-glow rounded-2xl")}><DragSortCard card={card as DragAndDropSortingCard} onLog={handleDragSortLog} /></div>;
      case 'Sequencing':
        return <div className={cn(isXpBoosted && "xp-boost-glow rounded-2xl")}><SequencingCard card={card as SequencingCardType} onLog={handleSequencingLog} /></div>;
      case 'CER':
        return <div className={cn(isXpBoosted && "xp-boost-glow rounded-2xl")}><CERStudyCard card={card as CERCard} onLog={handleCERLog} /></div>;

      default:
        return (
          <div className={cardContainerClasses}>
            <h1 className="text-3xl font-bold text-gray-800">{card.questionStem}</h1>
            <p className="mt-4 text-muted-foreground">This card type is not fully supported for interactive study yet.</p>
             <Button onClick={onNextCard} className="mt-4">Skip</Button>
          </div>
        );
    }
  }

  // Determine the final action for the footer
  const handleFinalAction = () => {
    if (card.cardFormat === 'Compare/Contrast') {
      handleCompareContrastLog();
    } else {
      if (!isRetryArmed || isCorrect) {
        onNextCard();
      }
    }
  };


  return (
    <>
        {renderCardContent()}
        <AnimatePresence>
            {showFeedback && (
              <motion.footer 
                className="w-full mt-8"
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: 20}}
              >
                <div className={cn(`flex justify-between items-center p-4 rounded-xl shadow-md`,
                    isCorrect ? "bg-green-100" : "bg-red-100"
                )}>
                  <div>
                    <h3 className={cn(`font-bold text-lg`, isCorrect ? "text-green-800" : "text-red-800")}>
                      {isCorrect ? "Correct!" : "Not quite"}
                    </h3>
                  </div>
                  <button
                    onClick={handleFinalAction}
                    className={cn(`py-3 px-6 font-bold text-white rounded-lg shadow-md`,
                      isCorrect ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    Continue
                  </button>
                </div>
              </motion.footer>
            )}
        </AnimatePresence>
    </>
  )
}









