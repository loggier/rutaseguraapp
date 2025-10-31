'use client';

import { useState, useCallback, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/page-header";
import { useUser } from "@/contexts/user-context";
import { Loader2, MessageSquareWarning } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyMailbox } from "./empty-mailbox";
import { IncidenceCard } from "./incidence-card";
import { getParentIncidents, type IncidenceWithStudent } from "../actions";
import { IncidenceDetailModal } from "./incidence-detail-modal";

// Mock data for alerts, will be replaced with real data later
const mockNotifications = [
    {
        icon: 'AlertTriangle',
        title: "Bus Salió de Ruta",
        description: "El bus de la ruta 'Ruta Matutina' se ha desviado.",
        timestamp: "hace 2 min",
        variant: "destructive" as const
    },
    {
        icon: 'CheckCircle',
        title: "Estudiante Recogido",
        description: `Tu hijo ha sido recogido(a) en su parada.`,
        timestamp: "hace 15 min"
    },
];

export default function NotificationsPage() {
    const { user } = useUser();
    const [incidents, setIncidents] = useState<IncidenceWithStudent[]>([]);
    const [loadingIncidents, setLoadingIncidents] = useState(false);
    const [selectedIncidence, setSelectedIncidence] = useState<IncidenceWithStudent | null>(null);

    const handleFetchIncidents = useCallback(async () => {
        if (!user?.id) return;
        setLoadingIncidents(true);
        try {
            const data = await getParentIncidents(user.id);
            setIncidents(data);
        } catch (error) {
            console.error("Failed to fetch incidents", error);
            setIncidents([]);
        } finally {
            setLoadingIncidents(false);
        }
    }, [user?.id]);
    
    const onTabChange = (tab: string) => {
        if (tab === 'incidencias' && user?.id) {
            handleFetchIncidents();
        }
    }

    const renderIncidents = () => {
        if (loadingIncidents) {
            return (
                 <div className="flex flex-1 items-center justify-center pt-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Cargando incidencias...</p>
                </div>
            );
        }
        if (incidents.length === 0) {
            return (
                <div className="text-center pt-12">
                    <MessageSquareWarning className="mx-auto h-24 w-24 text-muted-foreground/60" strokeWidth={1}/>
                    <p className="mt-4 font-semibold">No has reportado incidencias.</p>
                    <p className="text-sm text-muted-foreground">Aquí aparecerá el historial de tus reportes.</p>
                </div>
            );
        }
        return (
            <div className="space-y-4">
                {incidents.map(incidence => (
                    <IncidenceCard 
                        key={incidence.id} 
                        incidence={incidence}
                        onClick={() => setSelectedIncidence(incidence)} 
                    />
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="flex-shrink-0 p-4 md:p-6">
                    <PageHeader
                        title="Mi bandeja de entrada"
                        description="Aquí verás las notificaciones importantes y tus incidencias reportadas."
                    />
                </div>
                <Tabs defaultValue="alertas" className="flex flex-col flex-grow w-full px-4 md:px-6 overflow-hidden" onValueChange={onTabChange}>
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                        <TabsTrigger value="alertas">Alertas</TabsTrigger>
                        <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
                    </TabsList>
                    <TabsContent value="alertas" className="pt-4 flex-grow overflow-hidden">
                        <ScrollArea className="h-full pr-2">
                             <div className="text-center pt-12">
                                <EmptyMailbox className="mx-auto" />
                                <p className="mt-4 font-semibold">¡Listo! No tienes alertas nuevas.</p>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="incidencias" className="pt-4 flex-grow overflow-hidden">
                        <ScrollArea className="h-full pr-2">
                            {renderIncidents()}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>
            {selectedIncidence && (
                <IncidenceDetailModal 
                    incidence={selectedIncidence}
                    isOpen={!!selectedIncidence}
                    onClose={() => setSelectedIncidence(null)}
                />
            )}
        </>
    );
}