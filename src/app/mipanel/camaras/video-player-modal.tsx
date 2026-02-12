'use client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import EasyPlayer from './EasyPlayer';

type MultiVideoPlayerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  streamUrls: string[];
  busMatricula: string;
  isLoading: boolean;
};

export function MultiVideoPlayerModal({ isOpen, onClose, streamUrls, busMatricula, isLoading }: MultiVideoPlayerModalProps) {
    const gridCols = streamUrls.length > 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1';
    const gridItems = streamUrls.length > 0 ? `grid-cols-1 ${gridCols}` : 'grid-cols-1';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cámaras en vivo: {busMatricula}</DialogTitle>
          <DialogDescription>
            Visualizando {isLoading ? '...' : `${streamUrls.length}`} cámara(s). La conexión puede tardar unos segundos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden relative">
            {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-md">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                    <p className="mt-4 text-white font-semibold">Activando cámaras y conectando...</p>
                </div>
            ) : (
                <ScrollArea className="h-full">
                    <div className={cn('grid gap-2 p-1', gridItems)}>
                        {streamUrls.map((url, index) => (
                            <div key={index} className="aspect-video relative bg-black rounded-md overflow-hidden">
                                <EasyPlayer streamUrl={url} />
                                <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded-sm">
                                    Cámara {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
