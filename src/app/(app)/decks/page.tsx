
import { Suspense } from "react";
import DecksClient from "./DecksClient";
import { Loader2 } from "lucide-react";

function DecksSkeleton() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export default function DecksPage() {
  return (
    <Suspense fallback={<DecksSkeleton />}>
      <DecksClient />
    </Suspense>
  );
}
