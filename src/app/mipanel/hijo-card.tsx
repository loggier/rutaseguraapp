'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Estudiante, TrackedBus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bus, School, UserCheck, Clock, Home, AlertTriangle } from "lucide-react";

type HijoCardProps = {
    hijo: Estudiante;
    bus: TrackedBus | undefined;
    isActive: boolean;
    onClick?: () => void;
}

const statusConfig = {
    'pendiente': { text: 'Pendiente', variant: 'secondary' as const, Icon: Clock },
    'en_parada': { text: 'En Parada', variant: 'default' as const, className: 'bg-yellow-500 hover:bg-yellow-500/90 text-white', Icon: Bus },
    'recogido': { text: 'A Bordo', variant: 'default' as const, className: 'bg-green-600 hover:bg-green-600/90 text-white', Icon: UserCheck },
    'entregado': { text: 'Entregado', variant: 'default' as const, className: 'bg-blue-600 hover:bg-blue-600/90 text-white', Icon: Home },
    'ausente': { text: 'Ausente', variant: 'destructive' as const, Icon: AlertTriangle },
    'default': { text: 'Esperando Ruta', variant: 'secondary' as const, Icon: School },
};


export function HijoCard({ hijo, bus, isActive, onClick }: HijoCardProps) {
    
    const getStatus = () => {
        const estado = hijo.despacho_estado;
        if (estado && statusConfig[estado as keyof typeof statusConfig]) {
            return statusConfig[estado as keyof typeof statusConfig];
        }
        return null; // Return null if no active dispatch
    }
    
    const status = getStatus();

    return (
        <Card 
            className={cn(
                "transition-all", 
                isActive ? "ring-2 ring-primary shadow-lg" : "shadow-md",
                onClick && "cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary/50"
            )}
            onClick={onClick}
        >
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                    <AvatarImage src={hijo.avatar_url || ''} data-ai-hint="child face" />
                    <AvatarFallback className="text-xl">
                        {(hijo.nombre?.[0] || '')}{(hijo.apellido?.[0] || '')}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-lg truncate">{hijo.nombre} {hijo.apellido}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                       {bus ? <Bus className="h-4 w-4" /> : <School className="h-4 w-4" />}
                       <span className="truncate">{hijo.colegio_nombre || "Sin colegio asignado"}</span>
                    </div>
                    {status && (
                         <Badge variant={status.variant} className={cn("mt-2", status.className)}>
                            <status.Icon className="h-3 w-3 mr-1.5" />
                            {status.text}
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
