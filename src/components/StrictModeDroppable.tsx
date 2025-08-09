import type { DragEndEvent } from '@dnd-kit/core';
interface SortableItemProps {
  id: string | number;
  index: number;
  isSubmitted: boolean;
  correctOrder: Array<string | number>;
}
"use client";

import { useState, useMemo } from "react";
import type { SequencingCard as SequencingCardType } from '@/types';
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// Key Change: Imports are now from dnd-kit, specifically including sortable utilities.
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper to shuffle an array (this function remains the same).
const shuffle = (array: string[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

// Helper Component: A reusable, sortable item.
// It uses the useSortable hook to get all the necessary props.
function SortableItem({ id, index, isSubmitted, correctOrder }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Logic to determine styling after submission.
  const isCorrect = isSubmitted && id === correctOrder[index];
  const isIncorrect = isSubmitted && id !== correctOrder[index];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners} // The drag handle is now the whole item.
      className={cn(
        "flex items-center gap-4 rounded-md border bg-card p-4 shadow-sm transition-all",
        isCorrect && "border-green-500 bg-green-50",
        isIncorrect && "border-red-500 bg-red-50"
      )}
    >
      <div className={cn("flex h-6 w-6 items-center justify-center rounded-full font-bold text-sm",
          isCorrect && "bg-green-500 text-white",
          isIncorrect && "bg-red-500 text-white",
          !isSubmitted && "bg-primary text-primary-foreground"
      )}>
          {index + 1}
      </div>
      <span className="flex-1">{id}</span>
    </div>
  );
}


export default function SequencingCard({
  card,
  onLog
}: {
  card: SequencingCardType;
  onLog: (wasCorrect: boolean) => void;
}) {
  const correctOrder = useMemo(() => card.correctOrder, [card.correctOrder]);
  const initialItems = useMemo(() => shuffle([...card.items]), [card.items]);

  const [items, setItems] = useState<string[]>(initialItems);
  const [submitted, setSubmitted] = useState(false);

  // Key Change: dnd-kit sensor setup.
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Key Change: The onDragEnd handler is much simpler now.
  // It uses `arrayMove` from @dnd-kit/sortable to reorder the state array.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (submitted || !over) return;

    if (active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.indexOf(active.id as string);
        const newIndex = currentItems.indexOf(over.id as string);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };
  
  // Submission logic remains the same.
  const handleSubmit = () => {
    let allCorrect = true;
    for (let i = 0; i < items.length; i++) {
        if(items[i] !== correctOrder[i]) {
            allCorrect = false;
            break;
        }
    }
    setSubmitted(true);
    onLog(allCorrect);
  };

  return (
    <div className="w-full">
      <p className="mb-4 text-center text-xl font-semibold">{card.prompt}</p>
      
      {/* Key Change: The main JSX is wrapped in DndContext and SortableContext. */}
      {/* SortableContext needs the list of item IDs to manage the sorting. */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            {items.map((item, index) => (
              <SortableItem 
                key={item} 
                id={item} 
                index={index}
                isSubmitted={submitted}
                correctOrder={correctOrder}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-6 text-center">
        {!submitted && (
          <Button onClick={handleSubmit}>Check Order</Button>
        )}
        {submitted && (
           <p className="text-lg font-medium">
             {items.every((item, i) => item === correctOrder[i])
                ? "Ã¢Å“â€¦ Correct! Well done."
                : "Ã¢ÂÅ’ Some items are out of order."}
           </p>
        )}
      </div>
    </div>
  );
}




