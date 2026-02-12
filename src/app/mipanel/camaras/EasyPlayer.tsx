'use client';
import React, { useEffect, useRef } from 'react';

declare var EasyPlayerPro: any;

type EasyPlayerProps = {
    streamUrl: string;
};

const EasyPlayer: React.FC<EasyPlayerProps> = ({ streamUrl }) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    // Effect for creating and destroying the player instance
    useEffect(() => {
        // This function runs when the component mounts
        if (videoRef.current && typeof EasyPlayerPro !== 'undefined' && !playerRef.current) {
            try {
                playerRef.current = new EasyPlayerPro(videoRef.current, {
                    stretch: true,
                    hasAudio: true,
                    hasControl: true,
                });
            } catch (error) {
                console.error("Error creating EasyPlayerPro instance:", error);
            }
        }

        // This cleanup function runs when the component unmounts
        return () => {
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                     console.warn('Error al destruir el reproductor de video:', e);
                }
                playerRef.current = null; // Clear the ref on cleanup
            }
        };
    }, []); // Empty dependency array ensures this runs only on mount and unmount

    // Effect for playing the stream when the URL is available or changes
    useEffect(() => {
        if (playerRef.current && streamUrl) {
            playerRef.current.play(streamUrl).catch((err: any) => {
                console.error('Error al reproducir stream:', streamUrl, err);
            });
        }
    }, [streamUrl]);

    return <div ref={videoRef} className="w-full h-full bg-black" />;
};

export default EasyPlayer;
