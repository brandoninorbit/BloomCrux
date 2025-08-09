
"use client";

import { useEffect, useMemo, useState } from "react";
import { useUserAuth } from "@/app/Providers/AuthProvider";
import { getTopics } from "@/lib/firestore";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { Deck as StitchDeck, Topic as StitchTopic } from '@/stitch/types';

// ---------- Mock content (used when logged out or empty) ----------
const MOCK_NAME = "Sarah";
const MOCK_DECKS: StitchDeck[] = [
  { id: "m1", title: "Intro to Biology", description: "Biology", cards: [] },
  { id: "m2", title: "Spanish Vocabulary", description: "Spanish", cards: [] },
  { id: "m3", title: "World History", description: "History", cards: [] },
  { id: "m4", title: "Organic Chemistry", description: "Chemistry", cards: [] },
];

const MOCK_FOLDERS = [
  { name: "Science", sets: 12, color: "blue" },
  { name: "Languages", sets: 8, color: "green" },
  { name: "Humanities", sets: 15, color: "yellow" },
];

// ---------- Page ----------
export default function DecksPage() {
  const { user } = useUserAuth();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<StitchTopic[]>([]);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const t = await getTopics(user.uid);
        if (on) setTopics(t ?? []);
      } catch {
        if (on) setTopics([]);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [user]);

  const decks: StitchDeck[] = useMemo(() => {
    if (!user) return MOCK_DECKS;
    return topics.flatMap((t) => t.decks || []);
  }, [user, topics]);

  const firstName = useMemo(() => {
    if (!user?.displayName) return MOCK_NAME;
    return user.displayName.split(" ")[0] ?? user.displayName;
  }, [user]);

  // ---------- UI ----------
  return (
    <div className="relative min-h-screen flex flex-col bg-[#f9f9f9] text-[#111418]">
      {/* soft background */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-no-repeat bg-cover opacity-50 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ffffff;stop-opacity:0.1' /%3E%3Cstop offset='100%25' style='stop-color:%23f9f9f9;stop-opacity:0.1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='0' y='0' width='100%25' height='100%25' fill='url(%23grad)'/%3E%3C/svg%3E\"), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0 50 Q 25 25, 50 50 T 100 50' stroke='%23f0f2f4' stroke-width='1' fill='none'/%3E%3Cpath d='M0 60 Q 25 35, 50 60 T 100 60' stroke='%23f0f2f4' stroke-width='1' fill='none'/%3E%3Cpath d='M0 70 Q 25 45, 50 70 T 100 70' stroke='%23f0f2f4' stroke-width='1' fill='none'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tr from-cyan-50 to-blue-100 opacity-20 blur-3xl" />

      {/* main */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {firstName}</h2>
          <p className="text-[#637488] mb-6">Let&apos;s get learning.</p>

          {/* disabled search */}
          <div className="relative mb-2">
            <input
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1f8fff] focus:border-transparent transition-shadow shadow-sm"
              placeholder="Search your decks... (Coming Soon)"
              type="search"
              disabled
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-[#637488] italic px-2">Tip: Consistent review is the key to long‑term memory.</p>

          {/* Decks */}
          <section className="mt-12">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Decks</h3>
              <div className="flex items-center gap-4">
                <button className="bg-[#f0f2f4] text-[#111418] font-bold py-2 px-4 rounded-md hover:bg-gray-200 transition-colors">
                  New Set
                </button>
                <button className="bg-[#1f8fff] text-white font-bold py-2 px-4 rounded-md hover:bg-[#2481f9] transition-colors">
                  New Folder
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin inline-block text-[#1f8fff]" />
              </div>
            ) : decks.length === 0 ? (
              // No data for this user → show mock
              <DeckGrid decks={MOCK_DECKS} />
            ) : (
              <DeckGrid decks={decks} />
            )}
          </section>

          {/* Folders (still mock for now) */}
          <section className="mt-12">
            <h3 className="text-2xl font-semibold mb-4">Folders</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {MOCK_FOLDERS.map((f) => (
                <div
                  key={f.name}
                  className="bg-white rounded-xl shadow-md p-5 flex items-center gap-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div
                    className={`w-12 h-12 flex-shrink-0 rounded-lg bg-${f.color}-100 text-${f.color}-500 flex items-center justify-center`}
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                      <path
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold">{f.name}</p>
                    <p className="text-sm text-[#637488]">{f.sets} sets</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function DeckGrid({ decks }: { decks: StitchDeck[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {decks.map((d) => (
        <Link
          key={d.id}
          href={`/decks/${d.id}/study`}
          className="group perspective-1000 block"
          prefetch={false}
        >
          <div className="relative w-full aspect-[3/4] bg-white rounded-xl shadow-md transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-2 transform-style-3d group-hover:rotate-y-3">
            <div className="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center">
              <p className="text-lg font-medium text-[#637488]">{d.description || "Deck"}</p>
            </div>
            <div className="absolute bottom-4 left-4 text-sm font-medium">{d.title}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

    