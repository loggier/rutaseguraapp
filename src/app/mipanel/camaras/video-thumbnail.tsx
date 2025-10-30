
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
                "w-full h-24 flex items-center justify-start cursor-pointer transition-all border-2 p-3 gap-4",
                "hover:border-primary hover:bg-primary/10",
                isActive ? "border-primary bg-primary/10 ring-2 ring-primary" : "border-border"
            )}
        >
            <div className={cn("flex-shrink-0 h-16 w-16 rounded-md flex items-center justify-center", isActive ? "bg-primary/20" : "bg-muted")}>
                <Video className={cn("h-8 w-8", isActive ? "text-primary" : "text-muted-foreground")} />
            </div>
            <p className="text-sm font-semibold truncate">{stream.title}</p>
        </Card>
    );
}
