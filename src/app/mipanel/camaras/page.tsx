
'use client';

import { PageHeader } from "@/components/page-header";
import { VideoPlayer } from "@/components/video-player";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef, useCallback } from "react";
import { VideoThumbnail } from "./video-thumbnail";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bus } from "lucide-react";

declare const EasyPlayerPro: any;

const videoStreams = [
    { id: 1, title: "Cámara 1", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
    { id: 2, title: "Cámara 2", url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8' },
    { id: 3, title: "Cámara 3", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
    { id: 4, title: "Cámara 4", url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.mp4/.m3u8' },
];

type Stream = typeof videoStreams[0];

export default function CamerasPage() {
    const playerInstanceRef = useRef<any>(null);
    const playerNodeRef = useRef<HTMLDivElement>(null);
    
    const [activeStream, setActiveStream] = useState<Stream | null>(null);
    const [playerState, setPlayerState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Initialize player instance once
    const initializePlayer = useCallback(() => {
        if (playerInstanceRef.current || !playerNodeRef.current || typeof EasyPlayerPro === 'undefined') {
            return;
        }

        try {
            const player = new EasyPlayerPro(playerNodeRef.current, {
                stretch: true,
                hasAudio: true,
                hasControl: false,
            });
            playerInstanceRef.current = player;
            
            // Auto-play the first video after 3 seconds
            const timer = setTimeout(() => {
                if (videoStreams.length > 0) {
                    handleStreamChange(videoStreams[0]);
                }
            }, 3000);

            return () => clearTimeout(timer);

        } catch (e: any) {
            console.error("Error al inicializar EasyPlayerPro:", e);
            setPlayerState('error');
            setErrorMessage("No se pudo iniciar el reproductor. " + e.message);
        }
    }, []);

    // Cleanup player on unmount
    useEffect(() => {
        const player = playerInstanceRef.current;
        return () => {
            if (player) {
                try {
                    player.destroy();
                } catch (e) {
                    console.error("Error destroying EasyPlayerPro instance:", e);
                }
            }
        };
    }, []);


    const handleStreamChange = useCallback(async (stream: Stream) => {
        if (!playerInstanceRef.current) {
            setPlayerState('error');
            setErrorMessage("El reproductor no está inicializado.");
            return;
        }
        
        setPlayerState('loading');
        setErrorMessage(null);
        setActiveStream(stream);

        try {
             // pause() is not strictly necessary as play() stops the previous stream, but it's good practice.
            try { playerInstanceRef.current.pause(); } catch(e) {}

            await playerInstanceRef.current.play(stream.url);
            setPlayerState('playing');

        } catch(e: any) {
            console.error("Error en el método play:", e);
            setPlayerState('error');
            setErrorMessage("No se pudo conectar al stream de video.");
        }
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
                    <h2 className="text-xl font-bold tracking-tight">{activeStream?.title || 'Selecciona una cámara'}</h2>
                    <VideoPlayer
                        playerNodeRef={playerNodeRef}
                        playerState={playerState}
                        errorMessage={errorMessage}
                        onInit={initializePlayer}
                        onRetry={() => activeStream && handleStreamChange(activeStream)}
                    />
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
                                        isActive={activeStream?.id === stream.id}
                                        onClick={() => handleStreamChange(stream)}
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
