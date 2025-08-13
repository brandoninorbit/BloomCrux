'use client';

import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";


const BloomCruxIcon = () => (
    <Image src="https://firebasestorage.googleapis.com/v0/b/bloomcrux.firebasestorage.app/o/BloomCrux%20logo.png?alt=media&token=d86c90af-2186-4d28-95ed-be594b54ed30" alt="BloomCrux Logo" width={64} height={64} />
);

const WavyDivider = ({ className, fillColor = 'fill-white' }: { className?: string, fillColor?: string }) => (
    <div className={`absolute bottom-[-1px] left-0 w-full overflow-hidden leading-[0] ${className}`}>
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[120px]">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className={fillColor}></path>
        </svg>
    </div>
);

const WavyDividerTop = () => <WavyDivider className="top-[-1px] rotate-180" />;

const WavyDividerBottom = () => <WavyDivider className="rotate-180" fillColor="fill-background"/>

const FaqItem = ({ question, answer }: { question: string, answer: React.ReactNode }) => (
    <AccordionItem value={question} className="rounded-lg border bg-white p-4 transition-all duration-300 open:bg-primary/5 open:shadow-lg">
        <AccordionTrigger className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-left hover:no-underline">
            {question}
            <ChevronDown className="h-5 w-5 transition-transform duration-300 group-open:rotate-180" />
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground text-sm leading-relaxed mt-4">
            {answer}
        </AccordionContent>
    </AccordionItem>
)

export default function AboutPage() {
  return (
    <div className="relative flex w-full h-full min-h-screen flex-col overflow-x-hidden bg-background">
      <main className="flex-1">
        <section className="py-16 md:py-24 text-center">
            <div className="container mx-auto px-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-foreground">Master Any Subject, Faster.</h1>
                <p className="max-w-3xl mx-auto text-muted-foreground md:text-lg">
                    BloomCrux is an intelligent learning platform that adapts to you using cognitive science principles and gamified logic. We use cognitive science principles to create study tools that help you learn more effectively and retain information longer, with gamified logic to make learning more interactive and fun.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg" className="shadow-lg shadow-primary/30">
                        <Link href="/signup">Get started for free</Link>
                    </Button>
                </div>
            </div>
        </section>

        <section className="relative bg-white pt-24 pb-16 md:pt-32 md:pb-24">
            <WavyDividerTop />
            <div className="container mx-auto px-6 relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 md:mb-24 text-foreground">Why BloomCrux Works</h2>
                <div className="space-y-20">
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        <div className="md:w-1/2 relative">
                            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl rotate-[-2deg]">
                                <Image alt="AI-Powered Content Generation Interface" className="w-full h-full object-cover" src="https://firebasestorage.googleapis.com/v0/b/bloomcrux.firebasestorage.app/o/leverage%20AI.png?alt=media&token=f1ac1bc4-a6e3-40fd-a4be-8cb7211c1a24" width={600} height={400} data-ai-hint="content generation interface"/>
                            </div>
                            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg absolute top-0 left-0 translate-x-4 translate-y-4 border-4 border-white"></div>
                        </div>
                        <div className="md:w-1/2 md:pl-8 text-center md:text-left">
                            <h3 className="text-2xl font-semibold mb-3 text-foreground">AI-Powered Content</h3>
                            <p className="text-muted-foreground">
                                Leverage generative AI to create diverse, high-quality flashcardsâ€”from multiple choice to complex reasoningâ€”in seconds.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
                        <div className="md:w-1/2 relative">
                            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl rotate-[2deg]">
                                <Image alt="Adaptive Study Missions Dashboard" className="w-full h-full object-cover" src="https://firebasestorage.googleapis.com/v0/b/bloomcrux.firebasestorage.app/o/AdaptiveStudyModes.png?alt=media&token=5df95bd0-e332-4e50-80d0-33975acbae2f" width={600} height={400} data-ai-hint="missions dashboard"/>
                            </div>
                            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg absolute top-0 left-0 -translate-x-4 translate-y-4 border-4 border-white"></div>
                        </div>
                        <div className="md:w-1/2 md:pr-8 text-center md:text-left">
                            <h3 className="text-2xl font-semibold mb-3 text-foreground">Adaptive Study Missions</h3>
                            <p className="text-muted-foreground">
                                Engage in various study modes like Quest, Timed Drills, and Target Practice that adapt to your performance and keep you motivated.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        <div className="md:w-1/2 relative">
                            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl rotate-[-2deg]">
                                <Image alt="Actionable Progress Tracking with Bloom's Taxonomy" className="w-full h-full object-cover" src="https://firebasestorage.googleapis.com/v0/b/bloomcrux.firebasestorage.app/o/ActionableProgress.png?alt=media&token=bff11168-74e2-4016-b074-1baeb0c3c6dd" width={600} height={400} data-ai-hint="progress dashboard"/>
                            </div>
                            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg absolute top-0 left-0 translate-x-4 translate-y-4 border-4 border-white"></div>
                        </div>
                        <div className="md:w-1/2 md:pl-8 text-center md:text-left">
                            <h3 className="text-2xl font-semibold mb-3 text-foreground">Actionable Progress</h3>
                            <p className="text-muted-foreground">
                                Track your mastery across different levels of thinking with our <strong className="text-primary">Bloom's Taxonomy-based dashboard</strong>. Know exactly where to focus your efforts.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <WavyDividerBottom />
        </section>

        <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">Agent Briefing: Field Intelligence</h2>
                <Accordion type="single" collapsible className="max-w-3xl mx-auto space-y-4">
                    <FaqItem
                        question="What is Bloom's taxonomy and why is it my core training protocol?"
                        answer="It is a classified hierarchy of cognitive skills, from basic recall ('Remember') to advanced synthesis ('Create'). Your training is structured around this protocol to ensure you don't just memorize intel but can effectively analyze, evaluate, and apply it in high-stakes scenarios. Each level you master unlocks a deeper dimension of understanding."
                    />
                    <FaqItem
                        question="How do I level up and earn tokens?"
                        answer="You earn Experience Points (XP) for every correct answer. Higher-difficulty questions (like 'Analyze' or 'Evaluate') yield more XP. Accumulating XP increases your Commander Level and your level within each deck. Tokens are awarded for consistent performance and deck mastery, which you can spend on powerful upgrades in the Shop."
                    />
                    <FaqItem
                        question="What are the different mission types?"
                        answer={<>
                            Our platform offers various mission profiles to suit your training needs:
                            <br/><strong className="text-foreground">Quest:</strong> Standard-issue progression through a deck's cognitive levels.
                            <br/><strong className="text-foreground">Target Practice:</strong> Focus on intel you've previously answered incorrectly.
                            <br/><strong className="text-foreground">Timed Drill:</strong> A high-pressure test of speed and accuracy.
                            <br/><strong className="text-foreground">Level Up:</strong> Concentrate your efforts on mastering a single Bloom's Level at a time.
                        </>}
                    />
                </Accordion>
            </div>
        </section>
      </main>

      <footer className="bg-white border-t">
        <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} BloomCrux. All rights reserved.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <Link className="text-muted-foreground hover:text-primary text-sm" href="#">Terms of Service</Link>
                    <Link className="text-muted-foreground hover:text-primary text-sm" href="#">Privacy Policy</Link>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}

