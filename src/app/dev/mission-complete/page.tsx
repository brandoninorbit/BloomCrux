"use client";
import MissionComplete from "@/components/MissionComplete";
import { useRouter } from "next/navigation";

export default function MissionCompletePreview() {
  const router = useRouter();
  return (
    <div className="p-6">
      <MissionComplete
        modeName="Random Remix"
        deckName="MBB343 Lec 02 + 03"
        xp={200}
        coins={60}
        accuracy={90}
        questionsAnswered={40}
        onReturnHQ={() => router.push("/home")}
        onRestartMission={() => router.push("/decks/demo/study/random-remix")}
        globalProgress={null}
      />
    </div>
  );
}
