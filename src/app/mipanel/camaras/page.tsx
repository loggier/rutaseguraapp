'use client';

import { PageHeader } from "@/components/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, Camera, Loader2, Video, AlertTriangle } from "lucide-react";
import { useParentDashboard } from "../layout";
import type { TrackedBus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { MultiVideoPlayerModal } from "./video-player-modal";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function CamerasPage() {
    const { buses, loading: loadingBuses } = useParentDashboard();
    const [selectedBus, setSelectedBus] = useState<TrackedBus | null>(null);
    const [isPreparingStreams, setIsPreparingStreams] = useState(false);
    const [streamUrls, setStreamUrls] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    const cameraBuses = useMemo(() => {
        return buses.filter(b => b.imei_gps && (b.modelo_camara === 'jc181' || b.modelo_camara === 'jc400'));
    }, [buses]);

    const handleSelectBus = useCallback((bus: TrackedBus) => {
        setSelectedBus(bus);
    }, []);

    const handleWatchAllCameras = async (bus: TrackedBus) => {
        if (!bus.imei_gps) return;
        
        const channels = bus.video_channels || 1;

        setIsPreparingStreams(true);
        setIsModalOpen(true);
        setStreamUrls([]);

        const urls: string[] = [];

        try {
            for (let i = 0; i < channels; i++) {
                // The channel to send depends on the model.
                // JC400 expects 0-indexed, others expect 1-indexed.
                const apiChannel = bus.modelo_camara === 'jc400' ? i : i + 1;
                
                toast({
                    title: `Activando Cámara ${i + 1}...`,
                    description: `Enviando comando para el canal ${i + 1} del bus ${bus.matricula}.`,
                });

                const response = await fetch('/api/video/request-stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        imei: bus.imei_gps, 
                        channel: apiChannel,
                        model: bus.modelo_camara,
                     }),
                });

                const data = await response.json();
                
                if (!response.ok || !data.success) {
                    throw new Error(data.message || `No se pudo iniciar la transmisión para el canal ${i + 1}.`);
                }

                const streamUrl = data.url; // Use URL from response
                urls.push(streamUrl);
                
                await delay(1000);
            }
            
            setStreamUrls(urls);
            toast({
                title: "¡Cámaras Activadas!",
                description: "Abriendo reproductor de video...",
            });

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error de Transmisión',
                description: error.message,
            });
            setIsModalOpen(false);
        } finally {
            setIsPreparingStreams(false);
        }
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setStreamUrls([]);
    }

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="p-4 md:p-6 flex-shrink-0">
                    <PageHeader
                        title="Cámaras del Autobús"
                        description="Selecciona un vehículo para ver las cámaras disponibles."
                    />
                </div>
                
                <div className="flex-grow p-4 md:p-6 pt-0 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-100px)]">
                    <Card className="lg:col-span-2 flex flex-col items-center justify-center text-center p-6">
                        {selectedBus ? (
                            <>
                                <Bus className="h-16 w-16 text-primary mb-4" />
                                <h2 className="text-2xl font-bold">{selectedBus.matricula}</h2>
                                <p className="text-muted-foreground">Conductor: {selectedBus.conductor?.nombre || 'No asignado'}</p>
                                <p className="text-sm text-muted-foreground">Modelo Cámara: {selectedBus.modelo_camara}</p>
                                <p className="text-sm text-muted-foreground">Canales: {selectedBus.video_channels || 1}</p>
                                <div className="mt-6">
                                    <Button onClick={() => handleWatchAllCameras(selectedBus)} disabled={isPreparingStreams}>
                                        {isPreparingStreams ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Video className="mr-2 h-4 w-4" />}
                                        Ver Cámaras
                                    </Button>
                                </div>
                            </>
                        ) : (
                             <>
                                <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                                <h2 className="text-xl font-semibold">Ningún vehículo seleccionado</h2>
                                <p className="text-muted-foreground">Por favor, elige un vehículo de la lista para ver sus opciones de video.</p>
                             </>
                        )}
                    </Card>
                    
                    <Card className="flex flex-col h-full overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bus className="h-5 w-5" />
                                Vehículos con Cámara
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-hidden p-2 pt-0">
                            {loadingBuses ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin"/>
                                </div>
                            ) : cameraBuses.length > 0 ? (
                                <ScrollArea className="h-full pr-2">
                                    <div className="space-y-2">
                                        {cameraBuses.map((bus) => (
                                            <Card
                                                key={bus.id}
                                                onClick={() => handleSelectBus(bus)}
                                                className={cn(
                                                    "w-full flex items-center justify-start cursor-pointer transition-all border-2 p-3 gap-4",
                                                    "hover:border-primary hover:bg-primary/5",
                                                    selectedBus?.id === bus.id ? "border-primary bg-primary/10 ring-2 ring-primary/50" : "border-transparent"
                                                )}
                                            >
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-semibold truncate">{bus.matricula}</p>
                                                    <p className="text-xs text-muted-foreground">{bus.conductor?.nombre || 'Sin conductor'}</p>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
                                    <p className="font-semibold">No se encontraron vehículos</p>
                                    <p className="text-sm text-muted-foreground">No hay buses con cámaras compatibles asignados a las rutas de tus hijos.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {isModalOpen && selectedBus && (
                <MultiVideoPlayerModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    streamUrls={streamUrls}
                    busMatricula={selectedBus.matricula}
                    isLoading={isPreparingStreams}
                />
            )}
        </>
    );
}
    