'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2, PlayCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

declare const EasyPlayerPro: any;

interface VideoPlayerProps {
  streamUrl?: string | null;
  className?: string;
}

export function VideoPlayer({
  streamUrl,
  className,
}: VideoPlayerProps) {
  const playerNodeRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [playerState, setPlayerState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Si no hay URL, no hacemos nada. El reproductor mostrará el estado 'idle'.
    if (!streamUrl) {
      setPlayerState('idle');
      return;
    }

    // Si el nodo del DOM no está listo, tampoco hacemos nada.
    if (!playerNodeRef.current || typeof EasyPlayerPro === 'undefined') {
      setPlayerState('error');
      setErrorMessage("La librería del reproductor no está disponible o el contenedor no se ha montado.");
      return;
    }

    setPlayerState('loading');
    setErrorMessage(null);

    // Utilizamos un setTimeout para darle tiempo a React a renderizar el estado de 'loading'
    // antes de que la librería del reproductor bloquee el hilo principal.
    const playbackTimeout = setTimeout(() => {
      // Si no existe una instancia del reproductor, la creamos.
      if (!playerInstanceRef.current) {
        playerInstanceRef.current = new EasyPlayerPro(playerNodeRef.current, {
          stretch: true,
          hasAudio: true,
          hasControl: false,
        });
      }

      const player = playerInstanceRef.current;

      player.play(streamUrl)
        .then(() => {
          setPlayerState('playing');
        })
        .catch((e: any) => {
          console.error("Error en el método play:", e);
          setPlayerState('error');
          setErrorMessage("No se pudo conectar al stream de video. " + e.message);
        });
    }, 100); // Una pequeña espera es más robusta que 0

    return () => {
      clearTimeout(playbackTimeout);
    };

  }, [streamUrl]); // Este efecto se ejecuta cada vez que cambia la URL del stream

  // Efecto para limpiar la instancia del reproductor al desmontar el componente
  useEffect(() => {
    const player = playerInstanceRef.current;
    return () => {
      if (player) {
        try {
          player.destroy();
        } catch (e) {
          console.error("Error al destruir la instancia de EasyPlayerPro:", e);
        }
        playerInstanceRef.current = null;
      }
    };
  }, []);

  const handleRetry = () => {
    if (streamUrl) {
      // Forzamos un re-intento volviendo a ejecutar la lógica del useEffect principal
      // Esto es un poco un "hack", pero efectivo para este caso.
      // Una forma más limpia sería tener una función de reproducción separada, pero esto funciona.
      const currentUrl = streamUrl;
      const fakeNewUrl = currentUrl + '?retry=' + Date.now();
      
      // La lógica del useEffect [streamUrl] se re-disparará
       if (playerNodeRef.current) {
          setPlayerState('loading');
          setErrorMessage(null);
          playerInstanceRef.current?.play(currentUrl).then(() => {
              setPlayerState('playing');
          }).catch((e: any) => {
              setPlayerState('error');
              setErrorMessage("Fallo al reintentar. " + e.message);
          });
       }
    }
  };

  const renderOverlay = () => {
    switch (playerState) {
      case 'idle':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4 text-center z-10">
            <PlayCircle className="h-16 w-16 mb-4 opacity-70" />
            <p className='mt-2 font-semibold'>Selecciona un video para reproducir</p>
          </div>
        );
      case 'loading':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white pointer-events-none p-4 text-center z-10">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className='text-lg font-semibold'>Conectando al video...</p>
          </div>
        );
      case 'error':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 z-10">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className='text-lg font-bold text-center'>No se pudo cargar el video</p>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-4 max-w-xs">{errorMessage}</p>
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        );
      case 'playing':
      default:
        return null;
    }
  };
  
  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center", className)}>
      <div ref={playerNodeRef} className="w-full h-full" />
      {renderOverlay()}
    </div>
  );
}
