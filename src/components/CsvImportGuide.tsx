'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Info, BrainCircuit, Copy } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const HeaderRow = ({ text }: { text: string }) => {
    const { toast } = useToast();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard!" });
    };

    return (
        <div className="flex items-center justify-between p-2 my-2 bg-muted rounded-md text-xs font-mono">
            <span className="break-all">{text}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
                <Copy className="h-3 w-3" />
            </Button>
        </div>
    );
};


const GuideSection = ({ title, value, columns, note }: { title: string, value: string, columns: string, note?: string }) => (
    <div className="py-3">
        <h3 className="font-semibold text-md">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">Value for <code className="bg-muted px-1 py-0.5 rounded-sm">CardType</code> column: <code className="bg-muted px-1 py-0.5 rounded-sm">{value}</code></p>
        <p className="text-sm font-medium mt-2">Required Columns</p>
        <HeaderRow text={columns} />
        {note && <p className="text-xs text-muted-foreground mt-1">Note: {note}</p>}
    </div>
);

export default function CsvImportGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
            <Info className="mr-2 h-4 w-4" />
            Instructions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>CSV Import Formatting Guide</DialogTitle>
             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Use AI To Generate
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leveraging AI for Card Generation</DialogTitle>
                         <DialogDescription>
                            To get the best results from a large language model (LLM) like Gemini or ChatGPT, structure your prompt effectively.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 text-sm">
                        <div>
                            <h4 className="font-semibold mb-1">1. Provide Context & Content</h4>
                            <p className="text-muted-foreground">For the highest quality questions, paste your lecture notes, textbook chapters, or any other relevant content directly into the prompt.</p>
                        </div>
                         <div>
                            <h4 className="font-semibold mb-1">2. Give Clear Instructions</h4>
                            <p className="text-muted-foreground">Tell the AI to create a variety of question types. Aim for a good balance across all Bloom's Levels (Remember, Understand, Apply, Analyze, Evaluate, Create) so that each level has a relatively similar number of cards.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">3. Use the Formatting Guide</h4>
                            <p className="text-muted-foreground">Copy the entire CSV formatting guide from the previous dialog and paste it into your prompt. This gives the AI a perfect template to follow for its output.</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">4. Override Bloom Levels (Optional)</h4>
                             <p className="text-muted-foreground">By default, cards are assigned a Bloom Level based on their type (e.g., MCQ is 'Remember'). To override this, start the text in the "Question" column with the desired level in brackets.</p>
                             <div className="mt-2 p-3 bg-muted rounded-md border text-xs">
                                <p className="font-semibold">Example:</p>
                                <p>For a Standard MCQ you want to be at the 'Create' level, your question would be:</p>
                                <p className="font-mono mt-1 text-foreground">[Create] Based on the principles of natural selection, which of these hypothetical creatures would be most likely to thrive?</p>
                             </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
          </div>
          <DialogDescription>
            Your CSV must have a header row. The <code className="bg-muted px-1 py-0.5 rounded-sm">CardType</code> column is required and must exactly match one of the values below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-6">
            <GuideSection
                title="Standard MCQ"
                value="Standard MCQ"
                columns="CardType,Question,A,B,C,D,Answer,Explanation"
                note="Answer should be A, B, C, or D."
            />
             <GuideSection
                title="Two-Tier MCQ"
                value="Two-Tier MCQ"
                columns="CardType,Question,A,B,C,D,Answer,Tier2Question,Tier2A,Tier2B,Tier2C,Tier2D,Tier2Answer"
                note="Answer and Tier2Answer should be A, B, C, or D."
            />
            <GuideSection
                title="Fill in the Blank"
                value="Fill in the Blank"
                columns="CardType,Question,Answer"
                note='Question should contain underscores (e.g., "The capital of France is ____.") for the blank.'
            />
            <GuideSection
                title="Short Answer"
                value="Short Answer"
                columns="CardType,Question,SuggestedAnswer"
            />
             <GuideSection
                title="Compare/Contrast"
                value="Compare/Contrast"
                columns="CardType,ItemA,ItemB,Pairs"
                note="Pairs should be a pipe-separated (|) list of semicolon-separated (;) values. Example: Location;Nucleus;Cytoplasm|Molecule;DNA;mRNA"
            />
            <GuideSection
                title="Drag and Drop Sorting"
                value="Drag and Drop Sorting"
                columns="CardType,Title,Instructions,Categories,Items"
                note="Items should be a pipe-separated (|) list of the items and their correct category, separated by a semicolon (;). Example: Term A;Category 1|Term B;Category 2"
            />
            <GuideSection
                title="Sequencing"
                value="Sequencing"
                columns="CardType,Prompt,Items"
                note="Items should be a pipe-separated (|) list of the items in the correct order. Example: Prophase|Metaphase|Anaphase|Telophase"
            />
            <GuideSection
                title="Claim-Evidence-Reasoning (CER)"
                value="CER"
                columns="CardType,Scenario,Question,Parts"
                note="Parts should be a pipe-separated (|) list of semicolon-separated (;) values for each CER component. For Free Text: key;text;sampleAnswer (e.g., claim;text;Red light is better). For MCQ: key;mcq;Option1;Option2;...;correctIndex (e.g., evidence;mcq;Grew 3cm;Grew 1cm;0)"
            />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

