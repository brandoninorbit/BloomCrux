import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Book, Clock, Repeat, Star, Target } from "lucide-react";
import Link from "next/link";

const studyModes = [
  {
    name: 'Random Review',
    description: 'Shuffle all cards and review in a random order.',
    href: 'random-remix',
    icon: Repeat,
    available: true,
  },
  {
    name: 'Timed Challenge',
    description: 'Race against the clock to answer as many questions as you can.',
    href: 'timed-drill',
    icon: Clock,
    available: true,
  },
  {
    name: 'Weakest First',
    description: 'Focus on cards you\'ve previously struggled with.',
    href: 'target-practice',
    icon: Target,
    available: false,
  },
  {
    name: 'Starred Cards',
    description: 'Review only the cards you have marked as important.',
    href: 'starred-cards',
    icon: Star,
    available: false,
  },
   {
    name: 'Bloom Focus',
    description: 'A spaced-repetition mode to maximize long-term retention.',
    href: 'bloom-focus',
    icon: Book,
    available: false,
  },
];


export default function StudyModeSelectionPage({ params }: { params: { deckId: string } }) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Choose Your Study Mode</h1>
        <p className="text-muted-foreground mt-2">Select a mode to begin your study session.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studyModes.map(mode => (
          <Card key={mode.name} className={`flex flex-col transition-all ${!mode.available ? 'border-dashed bg-muted/50' : 'hover:border-primary bg-card'}`}>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
               <mode.icon className="w-8 h-8 text-primary" />
               <CardTitle>{mode.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{mode.description}</CardDescription>
            </CardContent>
            <CardContent>
               <Button asChild className="w-full" disabled={!mode.available}>
                <Link href={`/decks/${params.deckId}/study/${mode.href}`}>
                  Start <ArrowRight className="ml-2 w-4 h-4"/>
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
