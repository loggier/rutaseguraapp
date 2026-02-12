'use client';
import React, { useEffect, useRef } from 'react';

declare var EasyPlayerPro: any;

type EasyPlayerProps = {
    streamUrl: string;
};

const EasyPlayer: React.FC<EasyPlayerProps> = ({ streamUrl }) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        let player: any;
        if (videoRef.current && typeof EasyPlayerPro !== 'undefined') {
            player = new EasyPlayerPro(videoRef.current, {
                stretch: true,
                hasAudio: true,
                hasControl: true,
            });
            
            player.play(streamUrl).catch((err: any) => {
                console.error('Error al reproducir stream:', streamUrl, err);
            });

            playerRef.current = player;
        }

        return () => {
            if (player) {
                try {
                    player.destroy();
                } catch (e) {
                     console.warn('Error al destruir el reproductor de video:', e);
                }
            }
        };
    }, [streamUrl]);

    return <div ref={videoRef} className="w-full h-full bg-black" />;
};

export default EasyPlayer;
