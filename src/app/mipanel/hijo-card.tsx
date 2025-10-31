'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Estudiante, TrackedBus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bus, School } from "lucide-react";

type HijoCardProps = {
    hijo: Estudiante;
    bus: TrackedBus | undefined;
    isActive: boolean;
    onClick?: () => void;
}

export function HijoCard({ hijo, bus, isActive, onClick }: HijoCardProps) {
    
    const getStatus = () => {
        if (!bus) {
            return { text: "Esperando ruta", variant: "secondary" as const, className: "" };
        }
        return { text: "Listo para recogida", variant: "default" as const, className: "" };
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
                    <Badge variant={status.variant} className={cn("mt-2", status.className)}>{status.text}</Badge>
                </div>
            </CardContent>
        </Card>
    )
}
