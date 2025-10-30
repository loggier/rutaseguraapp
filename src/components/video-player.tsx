'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

declare const EasyPlayer: any;

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
  const playerInstanceRef = useRef<any>(null);
  const videoNodeRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const cleanupPlayer = useCallback(() => {
    if (playerInstanceRef.current) {
        try {
            playerInstanceRef.current.destroy();
        } catch (e) {
            console.error("Error destroying EasyPlayer instance:", e);
        }
        playerInstanceRef.current = null;
    }
  }, []);


  const initializePlayer = useCallback(() => {
    if (!videoNodeRef.current) {
      return;
    }
     if (typeof EasyPlayer === 'undefined' || typeof window.EasyPlayer === 'undefined') {
      setError('La librería EasyPlayer no se ha cargado correctamente.');
      setIsLoading(false);
      return;
    }

    cleanupPlayer();
    setIsLoading(true);
    setError(null);
    
    try {
      const player = new EasyPlayer(videoNodeRef.current, {
        videoUrl: src,
        live: true,
        autoplay: true,
        showControls: false,
        decodeType: "auto",
        hardDecode: false,
        debug: false, // Desactivar logs de consola de EasyPlayer
      });

      playerInstanceRef.current = player;
      
      let connectionTimeout: NodeJS.Timeout;

      player.on('error', (e: any) => {
        console.error('EasyPlayer Error:', e);
        setError('Error en la reproducción. Intente recargar.');
        setIsLoading(false);
        if (connectionTimeout) clearTimeout(connectionTimeout);
        cleanupPlayer();
      });
      
      player.on('play', () => {
        setIsLoading(false);
        setError(null);
        if (connectionTimeout) clearTimeout(connectionTimeout);
      });

      // Timeout por si 'play' o 'error' no se disparan
      connectionTimeout = setTimeout(() => {
          if(playerInstanceRef.current && isLoading) {
              setError('La conexión está tardando demasiado.');
              setIsLoading(false);
              cleanupPlayer();
          }
      }, 15000); // 15 segundos de espera

    } catch (e: any) {
      console.error("Error al inicializar EasyPlayer:", e);
      setError("No se pudo iniciar el reproductor de video.");
      setIsLoading(false);
    }
  }, [src, isLoading, cleanupPlayer]);
  
  useEffect(() => {
    initializePlayer();
    return () => {
      cleanupPlayer();
    };
  }, [retryCount, initializePlayer, cleanupPlayer]);


  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden", className)}>
      <div ref={videoNodeRef} className="w-full h-full" />

      {isLoading && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white pointer-events-none p-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className='text-lg font-semibold'>Conectando al video en vivo...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className='text-lg font-bold text-center'>No se pudo cargar el video</p>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
            </Button>
        </div>
      )}
    </div>
  );
}
