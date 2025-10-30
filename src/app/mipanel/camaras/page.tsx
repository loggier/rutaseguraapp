'use client';

import { PageHeader } from "@/components/page-header";
import { VideoPlayer } from "@/components/video-player";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Expand, Shrink } from "lucide-react";
import { Button } from "@/components/ui/button";

const videoStreams = [
    { id: 1, title: "Cámara Frontal", url: "ws://154.53.38.117:6604/3/3?AVType=1&jsession=FB01412CBF9E4BBFD018B48E118A9F9F&DevIDNO=000000593003&Channel=1&Stream=1&ttxplayer=1&ttxver=1" },
    { id: 2, title: "Cámara Interior 1", url: "ws://154.53.38.117:6604/3/3?AVType=1&jsession=FB01412CBF9E4BBFD018B48E118A9F9F&DevIDNO=000000593003&Channel=2&Stream=1&ttxplayer=1&ttxver=1" },
    { id: 3, title: "Cámara Interior 2", url: "ws://154.53.38.117:6604/3/3?AVType=1&jsession=FB01412CBF9E4BBFD018B48E118A9F9F&DevIDNO=000000593003&Channel=3&Stream=1&ttxplayer=1&ttxver=1" },
    { id: 4, title: "Cámara Trasera", url: "ws://154.53.38.117:6604/3/3?AVType=1&jsession=FB01412CBF9E4BBFD018B48E118A9F9F&DevIDNO=000000593003&Channel=4&Stream=1&ttxplayer=1&ttxver=1" },
];

export default function CamerasPage() {
    const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null);

    const handleToggleExpand = (id: number) => {
        setExpandedPlayer(current => (current === id ? null : id));
    };

    const isAnyPlayerExpanded = expandedPlayer !== null;

    return (
        <ScrollArea className="h-full">
            <div className={cn("flex flex-col gap-6 p-4 md:p-6", isAnyPlayerExpanded && "p-0 md:p-0")}>
                {!isAnyPlayerExpanded && (
                    <PageHeader
                        title="Cámaras en Vivo"
                        description="Monitorea las transmisiones de video de los vehículos en tiempo real."
                    />
                )}

                <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-4",
                    isAnyPlayerExpanded && "grid-cols-1 md:grid-cols-1"
                )}>
                    {videoStreams.map((stream) => {
                        const isExpanded = expandedPlayer === stream.id;
                        if (isAnyPlayerExpanded && !isExpanded) return null;

                        return (
                            <div key={stream.id} className="relative group">
                                <VideoPlayer src={stream.url} />
                                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold p-1 rounded">
                                    {stream.title}
                                </div>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="absolute top-2 right-2 h-8 w-8 bg-black/30 hover:bg-black/60 border-white/50 text-white hover:text-white"
                                    onClick={() => handleToggleExpand(stream.id)}
                                >
                                    {isExpanded ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ScrollArea>
    );
}
