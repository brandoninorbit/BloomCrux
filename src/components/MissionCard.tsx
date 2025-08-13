
"use client";

import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { LucideIcon } from "lucide-react";

interface MissionCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    children: React.ReactNode;
}

export default function MissionCard({ icon: Icon, title, description, children }: MissionCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-50, 50], [6, -6]);
    const rotateY = useTransform(x, [-50, 50], [-6, 6]);

    return (
        <motion.div
            ref={ref}
            onMouseMove={(e) => {
                const r = ref.current!.getBoundingClientRect();
                x.set(e.clientX - (r.left + r.width / 2));
                y.set(e.clientY - (r.top + r.height / 2));
            }}
            onMouseLeave={() => {
                x.set(0);
                y.set(0);
            }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
        >
            <Card className="flex flex-col h-full" style={{ transform: "translateZ(20px)" }}>
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription className="mt-1">{description}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end gap-2">
                    {children}
                </CardContent>
            </Card>
        </motion.div>
    );
}
