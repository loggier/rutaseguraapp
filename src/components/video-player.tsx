
'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2, PlayCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface VideoPlayerProps {
  playerNodeRef: React.RefObject<HTMLDivElement>;
  playerState: 'idle' | 'loading' | 'playing' | 'error';
  errorMessage: string | null;
  onInit: () => void;
  onRetry: () => void;
  className?: string;
}

export function VideoPlayer({
  playerNodeRef,
  playerState,
  errorMessage,
  onInit,
  onRetry,
  className,
}: VideoPlayerProps) {

  // Effect to trigger initialization
  useEffect(() => {
    if (playerState === 'idle') {
      onInit();
    }
  }, [playerState, onInit]);


  const renderOverlay = () => {
    switch (playerState) {
      case 'idle':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-4 text-center z-10">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className='mt-2 font-semibold'>Inicializando reproductor...</p>
             <p className='text-sm text-muted-foreground'>El video comenzará en breve.</p>
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
            <Button onClick={onRetry} variant="outline" size="sm">
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
