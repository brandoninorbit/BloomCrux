"use client"
import { Flashcard } from "@/components/study/flashcard";
import { useState, useEffect } from "react";

const sampleCards = [
  { id: 1, front: "const", back: "Declares a read-only named constant" },
  { id: 2, front: "let", back: "Declares a block-scoped local variable" },
  { id: 3, front: "var", back: "Declares a function-scoped or globally-scoped variable" },
  { id: 4, front: "=>", back: "Arrow function syntax" },
  { id: 5, front: "===", back: "Strict equality operator" },
];

export default function TimedDrillPage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % sampleCards.length);
  };

  const card = sampleCards[currentCardIndex];
  
  if (timeLeft <= 0) {
    return (
        <div className="text-center">
            <h1 className="text-4xl font-bold">Time's up!</h1>
            <p className="text-muted-foreground mt-2">You did great. Ready for another round?</p>
        </div>
    )
  }

  return (
    <div className="w-full text-center">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Timed Challenge</h1>
        <p className="text-4xl font-mono font-bold text-primary">{timeLeft}s</p>
      </div>
      <Flashcard 
        key={card.id}
        front={card.front} 
        back={card.back}
        onCardAnswered={handleNextCard}
      />
    </div>
  );
}
