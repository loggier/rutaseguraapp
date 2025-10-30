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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const videoRef = useCallback((node: HTMLDivElement | null) => {
    if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
    }

    if (!node) {
      return;
    }
    
    if (typeof EasyPlayer === 'undefined') {
      setError('La librería EasyPlayer no se ha cargado.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const initializePlayer = () => {
      try {
        const player = new EasyPlayer(node, {
          videoUrl: src,
          live: true,
          autoplay: true,
          showControls: false,
          decodeType: "auto",
          // Desactivar la decodificación por hardware puede ayudar con algunos streams
          hardDecode: false, 
        });

        playerInstanceRef.current = player;
        
        let connectionTimeout: NodeJS.Timeout;

        player.on('error', (e: any) => {
          console.error('EasyPlayer Error:', e);
          setError('Error en la reproducción. Intente recargar.');
          setIsLoading(false);
          if (connectionTimeout) clearTimeout(connectionTimeout);
        });
        
        player.on('play', () => {
          setIsLoading(false);
          if (connectionTimeout) clearTimeout(connectionTimeout);
        });

        // Agregamos un timeout por si el evento 'play' nunca se dispara
        connectionTimeout = setTimeout(() => {
            if(isLoading && playerInstanceRef.current){
                setError('La conexión está tardando demasiado.');
                setIsLoading(false);
            }
        }, 10000); // 10 segundos

      } catch (e: any) {
        console.error("Error al inicializar EasyPlayer:", e);
        setError("No se pudo iniciar el reproductor de video.");
        setIsLoading(false);
      }
    };
    
    initializePlayer();

  }, [src, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden", className)}>
      <div ref={videoRef} className="w-full h-full" />

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
