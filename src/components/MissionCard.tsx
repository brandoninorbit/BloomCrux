"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { LucideIcon } from "lucide-react";

interface MissionCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    children: React.ReactNode;
}

export default function MissionCard({ icon: Icon, title, description, children }: MissionCardProps) {
    return (
        <Card className="flex flex-col">
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
    )
}
