import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Lock } from "lucide-react";

interface DeckCardProps {
  id: string;
  title: string;
  cardCount: number;
  progress: number;
  unlocked: boolean;
}

export function DeckCard({ id, title, cardCount, progress, unlocked }: DeckCardProps) {
  return (
    <Card className={`flex flex-col transition-all hover:shadow-lg hover:border-primary/50 ${!unlocked ? 'bg-muted/50 border-dashed' : 'bg-card'}`}>
      <CardHeader>
        <CardTitle className="truncate">{title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <BookOpen className="w-4 h-4"/> 
          {cardCount} Cards
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {unlocked ? (
          <div>
            <span className="text-sm text-muted-foreground">Progress</span>
            <div className="flex items-center gap-2">
              <Progress value={progress} className="h-2" />
              <span className="text-sm font-semibold">{progress}%</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full">
            <Lock className="w-8 h-8 mb-2"/>
            <p className="font-semibold">LOCKED</p>
            <p className="text-xs">Complete other decks to unlock.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" disabled={!unlocked}>
          <Link href={`/decks/${id}/study`}>Start Studying</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}


