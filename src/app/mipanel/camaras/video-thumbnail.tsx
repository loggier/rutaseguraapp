'use client';

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Video } from "lucide-react";

type Stream = {
    id: number;
    title: string;
    url: string;
}

type VideoThumbnailProps = {
    stream: Stream;
    isActive: boolean;
    onClick: () => void;
};

export function VideoThumbnail({ stream, isActive, onClick }: VideoThumbnailProps) {
    return (
        <Card
            onClick={onClick}
            className={cn(
                "w-48 h-28 flex flex-col items-center justify-center cursor-pointer transition-all border-2",
                "hover:border-primary hover:bg-primary/10",
                isActive ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-border"
            )}
        >
            <Video className={cn("h-8 w-8 mb-2", isActive ? "text-primary" : "text-muted-foreground")} />
            <p className="text-sm font-semibold text-center truncate px-2">{stream.title}</p>
        </Card>
    );
}
