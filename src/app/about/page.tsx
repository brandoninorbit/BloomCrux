
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="container mx-auto flex max-w-4xl flex-col items-center justify-center p-4 py-16 text-center">
      <h1 className="text-5xl font-bold tracking-wider text-primary font-headline mb-4">
        Welcome to BloomCrux
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mb-8">
        BloomCrux is a gamified flashcard application designed to help you study more effectively by leveraging the principles of Bloom's Taxonomy. Master concepts from basic recall to complex creation.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/signup">Get Started</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/login">Login</Link>
        </Button>
      </div>
    </main>
  );
}
