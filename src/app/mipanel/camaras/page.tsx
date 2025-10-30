'use client';

import { PageHeader } from "@/components/page-header";
import { VideoPlayer } from "@/components/video-player";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
            
            <div className="flex-grow p-4 md:p-6 pt-0 flex flex-col gap-6">
                {/* Main Player */}
                <div className="w-full">
                    {activeStream && <VideoPlayer key={activeStream.id} src={activeStream.url} />}
                </div>
                
                {/* Video List */}
                <div className="flex-shrink-0">
                     <h3 className="text-lg font-semibold mb-3">Lista de Cámaras</h3>
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex w-max space-x-4 pb-4">
                            {videoStreams.map((stream) => (
                                <VideoThumbnail
                                    key={stream.id}
                                    stream={stream}
                                    isActive={activeStream.id === stream.id}
                                    onClick={() => setActiveStream(stream)}
                                />
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
