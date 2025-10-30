
'use client';

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bus } from "lucide-react";

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
                "w-full flex items-center justify-start cursor-pointer transition-all border-2 p-3 gap-4",
                "hover:border-primary hover:bg-primary/5",
                isActive ? "border-primary bg-primary/10 ring-2 ring-primary/50" : "border-transparent"
            )}
        >
            <div className={cn(
                "flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center transition-colors", 
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
                <Bus className="h-6 w-6" />
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{stream.title}</p>
                <p className="text-xs text-muted-foreground">En vivo</p>
            </div>
        </Card>
    );
}
