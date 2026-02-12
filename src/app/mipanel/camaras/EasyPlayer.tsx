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
        // Use a timeout to ensure the DOM element is fully rendered and sized,
        // especially when appearing inside a modal dialog.
        const initTimeout = setTimeout(() => {
            if (videoRef.current && typeof EasyPlayerPro !== 'undefined' && !playerRef.current) {
                try {
                    playerRef.current = new EasyPlayerPro(videoRef.current, {
                        stretch: true,
                        hasAudio: true,
                        hasControl: true,
                    });
                } catch (error) {
                    // This error is related to a 'compute-pressure' permissions policy and seems to be non-critical.
                    // We log it as a warning to avoid triggering the Next.js error overlay in development.
                    console.warn("A non-critical error occurred while initializing the video player:", error);
                }
            }
        }, 100);

        // This cleanup function runs when the component unmounts
        return () => {
            clearTimeout(initTimeout);
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                     console.warn('Error al destruir el reproductor de video:', e);
                }
                playerRef.current = null; // Clear the ref
            }
        };
    }, []); // Empty dependency array ensures this runs only on mount and unmount

    // Effect for playing the stream when the URL is available or changes
    useEffect(() => {
        // We only try to play if the player instance exists and we have a URL.
        if (playerRef.current && streamUrl) {
            playerRef.current.play(streamUrl).catch((err: any) => {
                console.error('Error al reproducir stream:', streamUrl, err);
            });
        }
    }, [streamUrl]);

    return <div ref={videoRef} className="w-full h-full bg-black" />;
};

export default EasyPlayer;
