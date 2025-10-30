
'use client';

import { PageHeader } from "@/components/page-header";
import { VideoPlayer } from "@/components/video-player";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { VideoThumbnail } from "./video-thumbnail";

const videoStreams = [
    { id: 1, title: "Cámara 1", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
    { id: 2, title: "Cámara 2", url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8' },
    { id: 3, title: "Cámara 3", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
    { id: 4, title: "Cámara 4", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
];

type Stream = typeof videoStreams[0];

export default function CamerasPage() {
    const [activeStream, setActiveStream] = useState<Stream>(videoStreams[0]);

    return (
        <div className="flex flex-col h-full">
             <div className="p-4 md:p-6 flex-shrink-0">
                <PageHeader
                    title="Cámaras en Vivo"
                    description="Selecciona un video de la lista para reproducirlo."
                />
            </div>
            
            <div className="flex-grow p-4 md:p-6 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-100px)]">
                {/* Main Player */}
                <div className="w-full lg:col-span-2">
                    {activeStream && <VideoPlayer key={activeStream.id} src={activeStream.url} />}
                </div>
                
                {/* Video List */}
                <div className="flex flex-col h-full overflow-hidden">
                     <h3 className="text-lg font-semibold mb-3 flex-shrink-0">Lista de Cámaras</h3>
                    <ScrollArea className="flex-grow pr-4">
                        <div className="space-y-3">
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
                </div>
            </div>
        </div>
    );
}
