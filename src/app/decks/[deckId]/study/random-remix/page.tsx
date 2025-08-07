"use client"
import { Flashcard } from "@/components/study/flashcard";
import { useState } from "react";

const sampleCards = [
  { id: 1, front: "Hola", back: "Hello" },
  { id: 2, front: "Adiós", back: "Goodbye" },
  { id: 3, front: "Gracias", back: "Thank you" },
  { id: 4, front: "Por favor", back: "Please" },
  { id: 5, front: "Sí", back: "Yes" },
];

export default function RandomRemixPage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % sampleCards.length);
  };
  
  const card = sampleCards[currentCardIndex];

  return (
    <div className="w-full text-center">
      <h1 className="text-3xl font-bold mb-2">Random Review</h1>
      <p className="text-muted-foreground mb-8">Click the card to flip it.</p>
      <Flashcard 
        key={card.id}
        front={card.front} 
        back={card.back}
        onCardAnswered={handleNextCard}
      />
    </div>
  );
}
