
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FlashcardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  onCardAnswered: () => void;
}

export function Flashcard({ front, back, onCardAnswered }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswerButtons, setShowAnswerButtons] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      setShowAnswerButtons(true);
    }
  };

  const handleAnswer = (correct: boolean) => {
    if (isClient) {
      toast({
        title: correct ? "Correct!" : "Keep trying!",
        description: correct ? "+10 points earned." : "This card will be reviewed again soon.",
        variant: correct ? "default" : "destructive",
        duration: 2000,
      });
    }
    
    // Reset card state and notify parent to show next card
    onCardAnswered();
    setIsFlipped(false);
    setShowAnswerButtons(false);
  };

  const flipVariants = {
    front: {
      rotateY: 0,
      transition: { duration: 0.3 }
    },
    back: {
      rotateY: 180,
      transition: { duration: 0.3 }
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
      <div className="w-full h-80 [perspective:1000px]">
        <motion.div
            className="relative w-full h-full"
            style={{ transformStyle: 'preserve-3d' }}
            initial="front"
            animate={isFlipped ? "back" : "front"}
            variants={flipVariants}
        >
            {/* Front of Card */}
            <div className="absolute w-full h-full [backface-visibility:hidden]">
                <Card className="w-full h-full flex items-center justify-center p-6 text-center cursor-pointer" onClick={handleFlip}>
                    <CardContent className="text-3xl font-bold p-0">{front}</CardContent>
                </Card>
            </div>
            {/* Back of Card */}
            <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <Card className="w-full h-full flex items-center justify-center p-6 text-center bg-secondary">
                    <CardContent className="text-2xl font-medium p-0">{back}</CardContent>
                </Card>
            </div>
        </motion.div>
      </div>

      <div className="h-10">
        <AnimatePresence>
        {showAnswerButtons && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-4"
          >
            <Button
              onClick={() => handleAnswer(false)}
              variant="destructive"
              size="lg"
            >
              Incorrect
            </Button>
            <Button
              onClick={() => handleAnswer(true)}
              className="bg-correct text-correct-foreground hover:bg-correct/90"
              size="lg"
            >
              Correct
            </Button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
