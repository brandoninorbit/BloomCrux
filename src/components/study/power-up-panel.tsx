"use client"
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { ChevronUp, HelpCircle, Shuffle, Timer, Zap } from "lucide-react";

const powerUps = [
  { name: "Shuffle Deck", cost: 20, icon: Shuffle, description: "Randomize remaining cards." },
  { name: "+15 Seconds", cost: 50, icon: Timer, description: "Add 15s to the timer." },
  { name: "Reveal Hint", cost: 75, icon: HelpCircle, description: "Get a hint for this card." },
];

export function PowerUpPanel({ tokens }: { tokens: number }) {
  return (
    <div className="w-full sticky bottom-0">
      <Collapsible className="bg-card border-t">
        <div className="container mx-auto px-4">
          <CollapsibleTrigger className="group flex justify-between items-center w-full py-2 text-left h-14">
            <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary"/>
                <h3 className="text-lg font-semibold">Power-Ups</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Expand</span>
              <ChevronUp className="h-5 w-5 transition-transform group-data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
              {powerUps.map((powerUp) => (
                <Card key={powerUp.name} className="p-3 bg-background/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <powerUp.icon className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-semibold">{powerUp.name}</p>
                        <p className="text-xs text-muted-foreground">{powerUp.description}</p>
                      </div>
                    </div>
                    <Button size="sm" disabled={tokens < powerUp.cost} className="shrink-0">
                      <span className="mr-2">Ã°Å¸ÂÂµÃ¯Â¸Â {powerUp.cost}</span>
                      Activate
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  )
}


