// components/AvatarFramePicker.tsx

import { avatarFrames } from "@/config/avatarFrames"
import Image from "next/image"
import { cn } from "@/lib/utils"

type Props = {
  unlocked: string[]
  active: string
  onSelect: (frameKey: string) => void
}

export default function AvatarFramePicker({ unlocked, active, onSelect }: Props) {
  return (
    <div className="space-y-4">
        <h3 className="text-md font-semibold text-foreground">Avatar Frames</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
        {unlocked.map((frameKey) => {
            const frame = avatarFrames[frameKey]
            const isActive = active === frameKey

            return (
            <button
                key={frameKey}
                className={cn(
                "relative group transition-transform hover:scale-105 p-1 rounded-full",
                frame.className,
                isActive && "ring-4 ring-blue-500"
                )}
                onClick={() => onSelect(frameKey)}
                aria-label={`Select ${frame.name}`}
            >
                <Image
                src="https://placehold.co/80x80.png" 
                alt="Avatar Preview"
                width={80}
                height={80}
                className="rounded-full object-cover w-20 h-20"
                data-ai-hint="avatar preview"
                />
                <span className="absolute -bottom-6 text-xs font-medium w-full text-center text-gray-700">
                {frame.name}
                </span>
            </button>
            )
        })}
        </div>
    </div>
  )
}


