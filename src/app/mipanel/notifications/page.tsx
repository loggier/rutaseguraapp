'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHeader } from "@/components/page-header";
import { useParentDashboard } from "../layout";
import { Loader2, MapPin, School, CheckCircle, AlertTriangle } from "lucide-react";
import { NotificationCard } from "./notification-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyMailbox } from "./empty-mailbox";

export default function NotificationsPage() {
    const { hijos, loading } = useParentDashboard();

    // Generate mock notifications using children's data
    const notifications = loading || hijos.length === 0 ? [] : [
        {
            icon: <AlertTriangle className="h-5 w-5" />,
            title: "Bus Salió de Ruta",
            description: "El bus de la ruta 'Ruta Matutina' se ha desviado del trayecto establecido.",
            timestamp: "hace 2 min",
            variant: "destructive" as const
        },
        {
            icon: <CheckCircle className="h-5 w-5" />,
            title: "Estudiante Recogido",
            description: `${hijos[0].nombre} ha sido recogido(a) en su parada.`,
            timestamp: "hace 15 min"
        },
        {
            icon: <MapPin className="h-5 w-5" />,
            title: "Bus Llegó a Parada",
            description: `El bus se encuentra en la parada de ${hijos[0].nombre}.`,
            timestamp: "hace 18 min"
        },
        ...(hijos.length > 1 ? [{
            icon: <CheckCircle className="h-5 w-5" />,
            title: "Estudiante Entregado",
            description: `${hijos[1].nombre} ha llegado a su parada de entrega.`,
            timestamp: "ayer"
        }] : []),
        {
            icon: <School className="h-5 w-5" />,
            title: "Llegada al Colegio",
            description: `El bus ha llegado al colegio ${hijos[0].colegio_nombre}.`,
            timestamp: "ayer"
        },
    ];

    const renderAlerts = () => {
      if (loading) {
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
                <EmptyMailbox className="mx-auto" />
                <p className="mt-4 font-semibold">¡Listo! No tienes mensajes nuevos.</p>
            </div>
        )
      }
      return (
        <div className="space-y-4">
            {notifications.map((notification, index) => (
                <NotificationCard 
                    key={index}
                    icon={notification.icon}
                    title={notification.title}
                    description={notification.description}
                    timestamp={notification.timestamp}
                    variant={notification.variant}
                />
            ))}
        </div>
      )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-4 md:p-6">
                <PageHeader
                    title="Mi bandeja de entrada"
                    description="Aquí verás las notificaciones y consejos importantes."
                />
            </div>
            <Tabs defaultValue="alertas" className="flex flex-col flex-grow w-full px-4 md:px-6 overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                    <TabsTrigger value="alertas">Alertas</TabsTrigger>
                    <TabsTrigger value="consejos">Consejos</TabsTrigger>
                </TabsList>
                <TabsContent value="alertas" className="pt-4 flex-grow overflow-hidden">
                    <ScrollArea className="h-full pr-2">
                        {renderAlerts()}
                    </ScrollArea>
                </TabsContent>
                <TabsContent value="consejos" className="pt-4 flex-grow overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="text-center pt-12">
                            <EmptyMailbox className="mx-auto" />
                            <p className="mt-4 font-semibold">¡Listo! No tienes consejos nuevos.</p>
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
