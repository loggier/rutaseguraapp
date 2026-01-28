'use client';

import { useState, useCallback, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/page-header";
import { useUser } from "@/contexts/user-context";
import { Loader2, MessageSquareWarning, Bus, School, AlertTriangle as AlertTriangleIcon, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getParentIncidents, type IncidenceWithStudent } from "../actions";
import { IncidenceCard } from "./incidence-card";
import { IncidenceDetailModal } from "./incidence-detail-modal";
import { NotificationCard } from "./notification-card";
import { useNotifications } from "../layout";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
    const { user } = useUser();
    const [incidents, setIncidents] = useState<IncidenceWithStudent[]>([]);
    const [loadingIncidents, setLoadingIncidents] = useState(false);
    const [selectedIncidence, setSelectedIncidence] = useState<IncidenceWithStudent | null>(null);

    const { notifications, loadingNotifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications();
    const [isMarking, setIsMarking] = useState(false);

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
        if (tab === 'incidencias' && incidents.length === 0) {
            handleFetchIncidents();
        }
    }

    useEffect(() => {
        if(user?.id) {
            handleFetchIncidents();
        }
    }, [user?.id, handleFetchIncidents]);

    const handleMarkAsRead = async (notificationId: string) => {
        await markNotificationAsRead(notificationId);
    };
    
    const handleMarkAll = async () => {
        setIsMarking(true);
        await markAllNotificationsAsRead();
        setIsMarking(false);
    }

    const getNotificationIcon = (type: string | null) => {
        switch (type) {
            case 'llegada_parada':
            case 'salida_colegio':
                return <Bus className="h-5 w-5" />;
            case 'llegada_colegio':
                return <School className="h-5 w-5" />;
            case 'alerta_trafico':
                return <AlertTriangleIcon className="h-5 w-5" />;
            default:
                return <Bell className="h-5 w-5" />;
        }
    };

    const renderAlerts = () => {
        if (loadingNotifications) {
             return (
                 <div className="flex flex-1 items-center justify-center pt-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Cargando alertas...</p>
                </div>
            );
        }
        if (notifications.length === 0) {
            return (
                <div className="text-center pt-12">
                    <Bell className="mx-auto h-24 w-24 text-muted-foreground/60" strokeWidth={1}/>
                    <p className="mt-4 font-semibold">No tienes alertas nuevas.</p>
                    <p className="text-sm text-muted-foreground">Cuando ocurra algo importante, lo verás aquí.</p>
                </div>
            );
        }
        return (
            <div className="space-y-4">
                {notifications.map(alert => (
                    <div key={alert.id} onClick={() => !alert.visto && handleMarkAsRead(alert.id)} className="cursor-pointer">
                        <NotificationCard 
                            icon={getNotificationIcon(alert.tipo)}
                            title={alert.tipo?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || "Notificación"}
                            description={alert.mensaje}
                            timestamp={formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: es })}
                            visto={alert.visto}
                            variant={alert.tipo === 'alerta_trafico' ? 'destructive' : 'default'}
                        />
                    </div>
                ))}
            </div>
        );
    };

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
                    >
                         {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleMarkAll} disabled={isMarking}>
                                {isMarking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Marcar todo como leído
                            </Button>
                        )}
                    </PageHeader>
                </div>
                <Tabs defaultValue="alertas" className="flex flex-col flex-grow w-full px-4 md:px-6 overflow-hidden" onValueChange={onTabChange}>
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                        <TabsTrigger value="alertas">Alertas</TabsTrigger>
                        <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
                    </TabsList>
                    <TabsContent value="alertas" className="pt-4 flex-grow overflow-hidden">
                        <ScrollArea className="h-full pr-2">
                             {renderAlerts()}
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
