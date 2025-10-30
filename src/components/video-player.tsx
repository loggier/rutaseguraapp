
'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2, PlayCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

declare const EasyPlayerPro: any;

interface VideoPlayerProps {
  src: string;
  className?: string;
  isPlaybackInitiated?: boolean;
}

export function VideoPlayer({ src, className, isPlaybackInitiated = false }: VideoPlayerProps) {
  const playerNodeRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Cleanup function to properly destroy the player instance
  const cleanupPlayer = useCallback(() => {
    if (playerInstanceRef.current) {
      try {
        playerInstanceRef.current.destroy();
      } catch (e) {
        console.error("Error destroying EasyPlayerPro instance:", e);
      }
      playerInstanceRef.current = null;
    }
  }, []);

  // Effect to clean up the player when the component unmounts
  useEffect(() => {
    return () => {
      cleanupPlayer();
    };
  }, [cleanupPlayer]);

  const initializeAndPlayPlayer = useCallback(() => {
    if (typeof EasyPlayerPro === 'undefined' || !playerNodeRef.current) {
      setError("La librería del reproductor no se ha cargado correctamente.");
      return;
    }
    
    cleanupPlayer(); // Clean up any existing instance before creating a new one

    try {
      const player = new EasyPlayerPro(playerNodeRef.current, {
        stretch: true,
        hasAudio: true,
        hasControl: false,
      });
      playerInstanceRef.current = player;
      
      setIsLoading(true);
      setError(null);
      
      player.play(src).then(() => {
        setIsLoading(false);
      }).catch((e: any) => {
        console.error("Error al reproducir el video:", e);
        setError("No se pudo conectar al stream de video.");
        setIsLoading(false);
      });

    } catch (e: any) {
      console.error("Error al inicializar EasyPlayerPro:", e);
      setError("No se pudo iniciar el reproductor. " + e.message);
      setIsLoading(false);
    }
  }, [src, cleanupPlayer]);

  const handleStartPlayback = useCallback(() => {
    if (hasStarted) return;
    setHasStarted(true);
    initializeAndPlayPlayer();
  }, [hasStarted, initializeAndPlayPlayer]);
  
  useEffect(() => {
    if (isPlaybackInitiated && !hasStarted) {
        handleStartPlayback();
    }
  }, [isPlaybackInitiated, hasStarted, handleStartPlayback]);

  const handleRetry = () => {
     setError(null);
     setIsLoading(false);
     setHasStarted(false);
  };
  
  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center", className)}>
      <div ref={playerNodeRef} className="w-full h-full" />
      
      {!hasStarted && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4 text-center z-10">
          <Button onClick={handleStartPlayback} variant="ghost" size="icon" className="h-20 w-20 text-white/80 hover:text-white hover:bg-white/20">
            <PlayCircle className="h-16 w-16" />
          </Button>
          <p className='mt-2 font-semibold'>Iniciar video en vivo</p>
        </div>
      )}

      {isLoading && hasStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white pointer-events-none p-4 text-center z-10">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p className='text-lg font-semibold'>Conectando al video...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 z-10">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className='text-lg font-bold text-center'>No se pudo cargar el video</p>
          <p className="text-sm text-muted-foreground text-center mt-1 mb-4 max-w-xs">{error}</p>
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}
