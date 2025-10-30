'use client';

import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2, PlayCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

declare const Cmsv6Player: any;

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
  const playerInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Generate a unique ID for each player instance
  const playerId = React.useMemo(() => `player-${Math.random().toString(36).substr(2, 9)}`, []);

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

  const initializePlayer = useCallback(() => {
    if (typeof window === 'undefined' || !document.getElementById(playerId)) {
      setError("El entorno de renderizado no es válido.");
      return;
    }
    
    if (typeof Cmsv6Player === 'undefined') {
        setError("La librería del reproductor (Cmsv6) no se cargó correctamente.");
        setIsLoading(false);
        return;
    }

    cleanupPlayer();
    setIsLoading(true);
    setError(null);
    setHasStarted(true);

    try {
      const player = new Cmsv6Player(playerId, {
        videoUrl: src,
        autoplay: true,
        live: true,
      });
      playerInstanceRef.current = player;

      player.on('error', (e: any) => {
        console.error('Cmsv6Player Error:', e);
        setError('Error en la reproducción. Intente recargar.');
        setIsLoading(false);
        cleanupPlayer();
      });
      
      player.on('play', () => {
        setIsLoading(false);
        setError(null);
      });

    } catch (e: any) {
      console.error("Error al inicializar Cmsv6Player:", e);
      setError("No se pudo iniciar el reproductor de video.");
      setIsLoading(false);
    }
  }, [src, playerId, cleanupPlayer]);


  const handleStartPlayback = () => {
    initializePlayer();
  };

  const handleRetry = () => {
    initializePlayer();
  };
  
  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center", className)}>
       <div id={playerId} className="w-full h-full" />
      
      {!hasStarted && !isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white z-10">
           <Button variant="ghost" size="icon" onClick={handleStartPlayback} className="h-20 w-20">
             <PlayCircle className="h-20 w-20 text-white/80 hover:text-white transition-colors" />
           </Button>
           <p className="mt-2 font-semibold">Iniciar Video</p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white pointer-events-none p-4 text-center z-10">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p className='text-lg font-semibold'>Conectando al video en vivo...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 z-10">
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
