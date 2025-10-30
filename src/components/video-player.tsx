'use client';

import React, { useRef, useState, useCallback, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2, PlayCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

declare const EasyPlayerPro: any;

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
  const playerNodeRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
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

  const initializePlayer = useCallback(() => {
    if (typeof EasyPlayerPro === 'undefined') {
      setError("La librería EasyPlayer no se cargó correctamente.");
      setIsLoading(false);
      return;
    }
    
    if (!playerNodeRef.current) {
        setError("El contenedor del video no está listo.");
        setIsLoading(false);
        return;
    }

    cleanupPlayer();
    setError(null);
    setIsLoading(true);

    try {
      const player = new EasyPlayerPro(playerNodeRef.current, {
        videoUrl: src,
        stretch: true,
        hasAudio: true,
        hasControl: false,
        live: true,
        autoplay: true,
      });
      playerInstanceRef.current = player;
      
      // La librería no parece tener eventos 'error' o 'play' estables,
      // así que manejamos el estado de carga con un temporizador.
      setTimeout(() => {
        if(playerInstanceRef.current) { // Si todavía existe, asumimos que está cargando
           setIsLoading(false);
        }
      }, 3000); // 3 segundos de carga

    } catch (e: any) {
      console.error("Error al inicializar EasyPlayerPro:", e);
      setError("No se pudo iniciar el reproductor de video. " + e.message);
      setIsLoading(false);
    }
  }, [src, cleanupPlayer]);

  useEffect(() => {
    return () => {
      cleanupPlayer();
    };
  }, [cleanupPlayer]);

  const handleStartPlayback = () => {
    setHasStarted(true);
    initializePlayer();
  };
  
  const handleRetry = () => {
     setError(null);
     setIsLoading(false);
     setHasStarted(false);
     cleanupPlayer();
  };
  
  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center", className)}>
        {/* El div que usará el reproductor */}
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
