'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2 } from 'lucide-react';

// Declara EasyPlayer en el ámbito global para que TypeScript lo reconozca
declare const EasyPlayer: any;

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export function VideoPlayer({ src, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Asegúrate de que el script EasyPlayer se haya cargado
    if (typeof EasyPlayer === 'undefined') {
      setError('La librería EasyPlayer no se ha cargado.');
      setIsLoading(false);
      return;
    }

    if (!videoRef.current) return;

    // Si ya existe una instancia, destrúyela antes de crear una nueva.
    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy();
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const player = new EasyPlayer(videoRef.current, {
        videoUrl: src,
        live: true,
        autoplay: true,
        showControls: true,
        decodeType: "auto",
        // Aquí puedes añadir más opciones de configuración de EasyPlayer si las necesitas
      });

      playerInstanceRef.current = player;
      
      // Simular fin de carga después de un breve período
      // EasyPlayer no parece tener un evento de "carga completa" claro
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2500); // Ajusta este tiempo si es necesario

      player.on('error', (e: any) => {
        console.error('EasyPlayer Error:', e);
        setError('Error en la reproducción de video.');
        setIsLoading(false);
      });
      
      player.on('play', () => {
          setIsLoading(false);
      });


    } catch (e: any) {
      console.error("Error al inicializar EasyPlayer:", e);
      setError("No se pudo iniciar el reproductor de video.");
      setIsLoading(false);
    }
    
    // Cleanup: se ejecuta cuando el componente se desmonta o el src cambia.
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  }, [src]);

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
            <p className="text