'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2 } from 'lucide-react';

declare const EasyPlayer: any;

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
  const playerInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This callback ref will be called by React when the div is mounted or unmounted.
  const videoRef = useCallback((node: HTMLDivElement | null) => {
    // If the node is null, it means the component is unmounting.
    if (!node) {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
      return;
    }

    // If the node exists, we can initialize the player.
    if (typeof EasyPlayer === 'undefined') {
      setError('La librería EasyPlayer no se ha cargado.');
      setIsLoading(false);
      return;
    }
    
    // Destroy any existing instance before creating a new one
    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy();
    }

    setIsLoading(true);
    setError(null);

    try {
      const player = new EasyPlayer(node, {
        videoUrl: src,
        live: true,
        autoplay: true,
        showControls: true,
        decodeType: "auto",
      });

      playerInstanceRef.current = player;
      
      const timer = setTimeout(() => {
        if (playerInstanceRef.current) { // Check if player still exists
          setIsLoading(false);
        }
      }, 3500);

      player.on('error', (e: any) => {
        console.error('EasyPlayer Error:', e);
        setError('Error en la reproducción de video.');
        setIsLoading(false);
        clearTimeout(timer);
      });
      
      player.on('play', () => {
          setIsLoading(false);
          clearTimeout(timer);
      });
      
      // The cleanup logic is now handled when the node is null.
    } catch (e: any) {
      console.error("Error al inicializar EasyPlayer:", e);
      setError("No se pudo iniciar el reproductor de video.");
      setIsLoading(false);
    }

  }, [src]); // The callback will re-run if the `src` prop changes.

  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden", className)}>
      <div ref={videoRef} className="w-full h-full" />

      {isLoading && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white pointer-events-none">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className='text-lg font-semibold'>Conectando al video en vivo...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 pointer-events-none">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className='text-lg font-bold text-center'>No se pudo cargar el video</p>
            <p className="text-sm text-muted-foreground text-center mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
