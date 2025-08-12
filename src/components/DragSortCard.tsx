
"use client";
import React, { useState } from "react";
import type { DragAndDropSortingCard, DndItem } from '@/types';
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

// Key Change: Imports are now from dnd-kit instead of.
import { 
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';

// Helper Component: A small, reusable component for each draggable item.
// This makes the main component's JSX much cleaner.
function DraggableItem({ item, isSubmitted, isCorrect }: { item: DndItem, isSubmitted: boolean, isCorrect: boolean | null }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.term,
    data: item, // Pass the whole item object for easy access in onDragEnd
    disabled: isSubmitted,
  });

  // This applies the transform style during dragging.
  const style = isDragging
    ? { transform: `translate3d(${transform?.x}px, ${transform?.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(`mb-2 p-3 border rounded-md shadow-sm transition-all`,
        isDragging && "bg-primary text-primary-foreground shadow-lg",
        !isSubmitted && "bg-card",
        isSubmitted && isCorrect === true && "bg-green-50 border-green-500",
        isSubmitted && isCorrect === false && "bg-red-50 border-red-500",
      )}
    >
      {item.term}
    </div>
  );
}

// Helper Component: A reusable component for each droppable column.
function DroppableColumn({ id, title, items, isSubmitted, checkCorrectness }: { id: string, title: string, items: DndItem[], isSubmitted: boolean, checkCorrectness: (item: DndItem, containerId: string) => boolean | null }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(`flex flex-col w-52 p-2 border rounded-lg transition-colors`,
        isOver ? "bg-primary/10 border-primary" : "bg-muted/50",
        id === 'Unsorted' && 'border-dashed'
      )}
    >
      <h3 className="mb-2 text-center font-semibold text-muted-foreground">
        {title}
      </h3>
      <div className="min-h-[100px] flex-grow">
        {items.map(item => (
          <DraggableItem 
            key={item.term} 
            item={item} 
            isSubmitted={isSubmitted} 
            isCorrect={checkCorrectness(item, id)}
          />
        ))}
      </div>
    </div>
  );
}


export default function DragSortCard({
  card,
  onLog
}: {
  card: DragAndDropSortingCard;
  onLog: (wasCorrect: boolean) => void;
}) {

  // Defensive check remains the same.
  if (!Array.isArray(card.items) || !Array.isArray(card.categories)) {
    return (
        <Card className="bg-destructive/10 border-destructive">
            <CardContent className="p-4 text-center text-destructive-foreground">
                <p className="font-semibold">Card Data Error</p>
                <p className="text-sm">This card is missing its items or categories. Please delete it and create it again.</p>
            </CardContent>
        </Card>
    )
  }

  const initialColumns: Record<string, DndItem[]> = {
    Unsorted: [...card.items]
  };
  card.categories.forEach((cat: string) => {
    initialColumns[cat] = [];
  });

  const [columns, setColumns] = useState(initialColumns);
  const [submitted, setSubmitted] = useState(false);
  
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const allPlaced = columns.Unsorted.length === 0 &&
    card.categories.reduce((sum, cat) => sum + (columns[cat] || []).length, 0) === card.items.length;

  const handleDragEnd = (event: DragEndEvent) => {
    if (submitted) return;
    const { active, over } = event;

    if (over) {
      const sourceColId = findContainer(active.id as string);
      const destColId = over.id as string;
      const draggedItem = active.data.current as DndItem;

      if (!sourceColId || !draggedItem || sourceColId === destColId) return;

      setColumns(prevColumns => {
        const newColumns = { ...prevColumns };
        
        const sourceItems = [...newColumns[sourceColId]];
        const itemIndex = sourceItems.findIndex(item => item.term === active.id);
        if (itemIndex > -1) {
          sourceItems.splice(itemIndex, 1);
          newColumns[sourceColId] = sourceItems;
        }

        const destItems = newColumns[destColId] ? [...newColumns[destColId]] : [];
        destItems.push(draggedItem);
        newColumns[destColId] = destItems;

        return newColumns;
      });
    }
  };

  const findContainer = (itemId: string) => {
    for (const colId in columns) {
        if (columns[colId].some(item => item.term === itemId)) {
            return colId;
        }
    }
    return null;
  };
  
  const checkCorrectness = (item: DndItem, containerId: string): boolean | null => {
    if (!submitted || containerId === 'Unsorted') return null;
    return item.correctCategory === containerId;
  };
  
  const handleSubmit = () => {
    let overallCorrect = true;
    if (columns.Unsorted.length > 0) {
        overallCorrect = false;
    } else {
        card.categories.forEach((cat: string) => {
          (columns[cat] || []).forEach((item: DndItem) => {
            if (item.correctCategory !== cat) {
              overallCorrect = false;
            }
          });
        });
    }
    
    setSubmitted(true);
    onLog(overallCorrect);
  };

  return (
    <div className="w-full">
      <p className="mb-4 text-center text-xl font-semibold">{card.prompt}</p>
      
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="flex flex-wrap justify-center gap-4 pb-4">
          {Object.entries(columns).map(([colId, items]) => (
            <DroppableColumn 
              key={colId} 
              id={colId} 
              title={colId} 
              items={items}
              isSubmitted={submitted}
              checkCorrectness={checkCorrectness}
            />
          ))}
        </div>
      </DndContext>

      <div className="mt-6 text-center">
        {!submitted && (
          <Button onClick={handleSubmit} disabled={!allPlaced}>
            Check Answer
          </Button>
        )}
      </div>
    </div>
  );
}
