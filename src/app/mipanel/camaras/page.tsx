
'use client';

import { PageHeader } from "@/components/page-header";
import { VideoPlayer } from "@/components/video-player";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { VideoThumbnail } from "./video-thumbnail";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bus } from "lucide-react";

const videoStreams = [
    { id: 1, title: "Cámara Frontal", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
    { id: 2, title: "Cámara Pasillo", url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8' },
    { id: 3, title: "Cámara Trasera", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
    { id: 4, title: "Cámara Puerta", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
];

type Stream = typeof videoStreams[0];

export default function CamerasPage() {
    const [activeStream, setActiveStream] = useState<Stream>(videoStreams[0]);
    const [isPlaybackInitiated, setIsPlaybackInitiated] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsPlaybackInitiated(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col h-full">
             <div className="p-4 md:p-6 flex-shrink-0">
                <PageHeader
                    title="Cámaras del Autobús"
                    description="Selecciona una cámara para ver la transmisión en vivo."
                />
            </div>
            
            <div className="flex-grow p-4 md:p-6 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-100px)]">
                {/* Main Player */}
                <div className="w-full lg:col-span-2 flex flex-col gap-4">
                    <h2 className="text-xl font-bold tracking-tight">{activeStream.title}</h2>
                    {activeStream && (
                        <VideoPlayer 
                            key={activeStream.id} 
                            src={activeStream.url} 
                            isPlaybackInitiated={activeStream.id === videoStreams[0].id ? isPlaybackInitiated : false}
                        />
                    )}
                </div>
                
                {/* Video List */}
                <Card className="flex flex-col h-full overflow-hidden">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bus className="h-5 w-5" />
                            Cámaras Disponibles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden p-2 pt-0">
                        <ScrollArea className="h-full pr-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                                {videoStreams.map((stream) => (
                                    <VideoThumbnail
                                        key={stream.id}
                                        stream={stream}
                                        isActive={activeStream.id === stream.id}
                                        onClick={() => setActiveStream(stream)}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
