'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Estudiante, TrackedBus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bus, School } from "lucide-react";

type SimulationState = {
  status: 'paused' | 'running' | 'stopped' | 'finished';
  currentStopIndex: number;
  currentTurno: 'Recogida' | 'Entrega';
};

type HijoCardProps = {
    hijo: Estudiante;
    bus: TrackedBus | undefined;
    simulation: SimulationState | undefined;
    isActive: boolean;
}

export function HijoCard({ hijo, bus, simulation, isActive }: HijoCardProps) {
    
    const getStatus = () => {
        if (!bus || !simulation) {
            return { text: "Fuera de ruta", variant: "secondary" as const };
        }
        if (simulation.status === 'finished') {
            return { text: "Ruta finalizada", variant: "outline" as const };
        }
        if (simulation.status === 'running') {
            return { text: `En ruta - ${simulation.currentTurno}`, variant: "default" as const, className: "bg-green-600" };
        }
        return { text: "Esperando ruta", variant: "secondary" as const };
    }
    
    const status = getStatus();

    return (
        <Card className={cn("transition-all", isActive ? "ring-2 ring-primary shadow-lg" : "shadow-md")}>
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-16 w-16 border">
                    <AvatarImage src={hijo.avatar_url || ''} data-ai-hint="child face" />
                    <AvatarFallback className="text-xl">
                        {(hijo.nombre?.[0] || '')}{(hijo.apellido?.[0] || '')}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-bold text-lg truncate">{hijo.nombre} {hijo.apellido}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                       {bus ? <Bus className="h-4 w-4" /> : <School className="h-4 w-4" />}
                       <span>{bus?.matricula || "En el colegio"}</span>
                    </div>
                    <Badge variant={status.variant} className={cn("mt-2", status.className)}>{status.text}</Badge>
                </div>
            </CardContent>
        </Card>
    )
}
