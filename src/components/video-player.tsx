'use client';

import React, { useRef, useEffect } from 'react';
import flv from 'flv.js';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<flv.Player | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !flv.isSupported() || !videoRef.current) {
        setError('FLV.js no es soportado en este navegador.');
        setIsLoading(false);
        return;
    }

    const videoElement = videoRef.current;
    
    // Si ya existe un reproductor, destrúyelo antes de crear uno nuevo.
    if (playerRef.current) {
        playerRef.current.destroy();
    }

    try {
        const flvPlayer = flv.createPlayer({
            type: 'flv',
            isLive: true,
            url: src,
        }, {
             enableStashBuffer: false,
             stashInitialSize: 128,
        });

        playerRef.current = flvPlayer;
        
        flvPlayer.attachMediaElement(videoElement);
        flvPlayer.load();
        
        const playPromise = flvPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch(playError => {
            // El auto-play fue bloqueado, lo cual es común.
            // El usuario necesitará interactuar para iniciar la reproducción.
            console.warn("La reproducción automática fue bloqueada:", playError);
            // podrías mostrar un botón de "Play" aquí
          });
        }

        flvPlayer.on(flv.Events.LOADING_COMPLETE, () => {
             setIsLoading(false);
        });
        flvPlayer.on(flv.Events.RECOVERED, () => {
             setIsLoading(false);
             setError(null);
        });

        flvPlayer.on(flv.Events.ERROR, (errType, errDetail) => {
            console.error('FLV Player Error:', errType, errDetail);
            setError(`Error de reproducción: ${errDetail}`);
            setIsLoading(false);
        });

    } catch(e: any) {
        console.error("Error al inicializar el reproductor FLV:", e);
        setError("No se pudo iniciar el reproductor de video.");
        setIsLoading(false);
    }
    
    // Cleanup: se ejecuta cuando el componente se desmonta o el src cambia.
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [src]);

  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden", className)}>
      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        muted
        autoPlay
        playsInline
      />
      {isLoading && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className='text-lg font-semibold'>Conectando al video en vivo...</p>
        </div>
      )}
      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className='text-lg font-bold text-center'>No se pudo cargar el video</p>
            <p className="text-sm text-center text-muted-foreground mt-2">{error}</p>
        </div>
      )}
    </div>
  );
}
