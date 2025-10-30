'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

declare const Cmsv6Player: any;

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
        console.error("Error destroying Cmsv6Player instance:", e);
      }
      playerInstanceRef.current = null;
    }
  }, []);

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    let isMounted = true;

    const initializePlayer = () => {
      if (!isMounted || !videoNodeRef.current || playerInstanceRef.current) return;
      
      cleanupPlayer();
      setIsLoading(true);
      setError(null);

      try {
        const player = new Cmsv6Player(videoNodeRef.current, {
          videoUrl: src,
          autoplay: true,
          live: true,
        });

        playerInstanceRef.current = player;
        
        player.on('error', (e: any) => {
          if (!isMounted) return;
          console.error('Cmsv6Player Error:', e);
          setError('Error en la reproducción. Intente recargar.');
          setIsLoading(false);
          cleanupPlayer();
        });
        
        player.on('play', () => {
          if (!isMounted) return;
          setIsLoading(false);
          setError(null);
        });

      } catch (e: any) {
        if (!isMounted) return;
        console.error("Error al inicializar Cmsv6Player:", e);
        setError("No se pudo iniciar el reproductor de video.");
        setIsLoading(false);
      }
    };
    
    // Esperar a que la librería Cmsv6Player esté disponible en window
    if (typeof window !== 'undefined') {
        if ((window as any).Cmsv6Player) {
            initializePlayer();
        } else {
            let attempts = 0;
            checkInterval = setInterval(() => {
                attempts++;
                if ((window as any).Cmsv6Player) {
                    clearInterval(checkInterval);
                    initializePlayer();
                } else if (attempts > 50) { // Esperar hasta 5 segundos
                    clearInterval(checkInterval);
                     if (isMounted) {
                        setError('La librería del reproductor (cmsv6) no se cargó correctamente.');
                        setIsLoading(false);
                    }
                }
            }, 100);
        }
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      cleanupPlayer();
    };
  }, [src, retryCount, cleanupPlayer]);

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
