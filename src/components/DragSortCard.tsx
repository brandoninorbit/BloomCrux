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
  useSensors
, DragEndEvent } from '@dnd-kit/core';

// Helper Component: A small, reusable component for each draggable item.
// This makes the main component's JSX much cleaner.
function DraggableItem({ item, isSubmitted }: { item: DndItem, isSubmitted: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.term,
    data: item, // Pass the whole item object for easy access in onDragEnd
    disabled: isSubmitted,
  });

  // This applies the transform style during dragging.
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(`mb-2 p-3 border rounded-md shadow-sm transition-shadow`,
        isDragging
          ? "bg-primary text-primary-foreground shadow-lg" // Style for when an item is being dragged
          : "bg-card"
      )}
    >
      {item.term}
    </div>
  );
}

// Helper Component: A reusable component for each droppable column.
function DroppableColumn({ id, title, items, isSubmitted }: { id: string, title: string, items: DndItem[], isSubmitted: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(`flex flex-col w-52 p-2 border rounded-lg transition-colors`,
        isOver ? "bg-primary/10 border-primary" : "bg-muted/50", // Style for when an item is hovering over the column
        id === 'Unsorted' && 'border-dashed'
      )}
    >
      <h3 className="mb-2 text-center font-semibold text-muted-foreground">
        {title}
      </h3>
      <div className="min-h-[100px] flex-grow">
        {/* Renders all items passed to it */}
        {items.map(item => (
          <DraggableItem key={item.term} item={item} isSubmitted={isSubmitted} />
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
  const [isCorrect, setIsCorrect] = useState(false);

  // Key Change: dnd-kit uses sensors to detect input (mouse, keyboard, touch).
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  const allPlaced = columns.Unsorted.length === 0 &&
    card.categories.reduce((sum, cat) => sum + (columns[cat] || []).length, 0) === card.items.length;

  // Key Change: The onDragEnd handler is rewritten for dnd-kit's event structure.
  // It uses `active` (the item being dragged) and `over` (the droppable area it's over).
  const handleDragEnd = (event: DragEndEvent) => {
    if (submitted) return;
    const { active, over } = event;

    if (over) {
      const sourceColId = findContainer(active.id as string);
      const destColId = over.id as string;
      const draggedItem = active.data.current as DndItem;

      if (!sourceColId || !draggedItem || sourceColId === destColId) return;

      // Logic to move the item between columns in state.
      setColumns(prevColumns => {
        const newColumns = { ...prevColumns };
        
        // Remove from source column
        const sourceItems = [...newColumns[sourceColId]];
        const itemIndex = sourceItems.findIndex(item => item.term === active.id);
        if (itemIndex > -1) {
          sourceItems.splice(itemIndex, 1);
          newColumns[sourceColId] = sourceItems;
        }

        // Add to destination column
        const destItems = newColumns[destColId] ? [...newColumns[destColId]] : [];
        destItems.push(draggedItem);
        newColumns[destColId] = destItems;

        return newColumns;
      });
    }
  };

  // Helper function to find which column an item is currently in.
  const findContainer = (itemId: string) => {
    for (const colId in columns) {
        if (columns[colId].some(item => item.term === itemId)) {
            return colId;
        }
    }
    return null;
  };
  
  // Submission logic remains the same.
  const handleSubmit = () => {
    let correct = true;
    card.categories.forEach((cat: string) => {
      (columns[cat] || []).forEach((item: DndItem) => {
        if (item.correctCategory !== cat) correct = false;
      });
    });
    setIsCorrect(correct);
    setSubmitted(true);
    onLog(correct);
  };

  return (
    <div className="w-full">
      <p className="mb-4 text-center text-xl font-semibold">{card.prompt}</p>
      
      {/* Key Change: The main JSX is now wrapped in DndContext. */}
      {/* It's much simpler because the complex logic is in the helper components. */}
      <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
        <div className="flex flex-wrap justify-center gap-4 pb-4">
          {Object.entries(columns).map(([colId, items]) => (
            <DroppableColumn 
              key={colId} 
              id={colId} 
              title={colId} 
              items={items}
              isSubmitted={submitted}
            />
          ))}
        </div>
      </DndContext>

      <div className="mt-6 text-center">
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={!allPlaced}>
            Check Answer
          </Button>
        ) : (
          <p className={cn(`text-lg font-medium`, isCorrect ? "text-green-600" : "text-red-600")}>
            {isCorrect ? "Ã¢Å“â€¦ All items sorted correctly!" : "Ã¢ÂÅ’ Some items are misplaced. Try again on your next review!"}
          </p>
        )}
      </div>
    </div>
  );
}


