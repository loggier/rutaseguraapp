'use client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ReactPlayer from 'react-player/lazy';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';


type VideoPlayerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
};

export function VideoPlayerModal({ isOpen, onClose, videoUrl }: VideoPlayerModalProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reproductor de Video</DialogTitle>
          <DialogDescription>
            Visualizando la transmisión. La conexión puede tardar unos segundos en establecerse.
          </DialogDescription>
        </DialogHeader>
        <div className='aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center'>
             {isClient ? (
                <ReactPlayer
                    url={videoUrl}
                    playing={true}
                    controls={true}
                    width="100%"
                    height="100%"
                    config={{
                        file: {
                            attributes: {
                                controlsList: 'nodownload'
                            }
                        }
                    }}
                />
             ) : (
                <div className='flex flex-col items-center gap-4 text-white'>
                    <Loader2 className='h-8 w-8 animate-spin' />
                    <p>Cargando reproductor...</p>
                </div>
             )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
