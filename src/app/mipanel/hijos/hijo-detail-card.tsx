'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Estudiante, Parada } from "@/lib/types";
import { Info, MapPin, School, Home, Edit } from "lucide-react";
import { useParentDashboard } from "../layout";

type HijoDetailCardProps = {
    hijo: Estudiante & { paradas: Parada[], ruta_id?: string };
}

const AddressRow = ({ icon: Icon, type, stop }: { icon: React.ElementType, type: string, stop: Parada | undefined }) => (
    <div className="flex items-start gap-3 text-sm">
        <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
        <div className="flex-1">
            <p className="font-semibold text-foreground">{type}</p>
            {stop ? (
                <p className="text-muted-foreground">{stop.direccion}</p>
            ) : (
                <p className="text-muted-foreground text-xs">No hay parada principal configurada.</p>
            )}
        </div>
    </div>
);


export function HijoDetailCard({ hijo }: HijoDetailCardProps) {
    const { buses } = useParentDashboard();
    const bus = buses.find(b => b.ruta?.id === hijo.ruta_id);

    const paradaRecogida = hijo.paradas.find(p => p.tipo === 'Recogida' && p.sub_tipo === 'Principal');
    const paradaEntrega = hijo.paradas.find(p => p.tipo === 'Entrega' && p.sub_tipo === 'Principal');
    
    return (
        <Card className="shadow-md">
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold text-muted-foreground">{hijo.colegio_nombre || "Colegio No Asignado"}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                        <Info className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>
                
                <div className="flex items-center gap-4">
                     <Avatar className="h-16 w-16 border">
                        <AvatarImage src={hijo.avatar_url || ''} data-ai-hint="child face" />
                        <AvatarFallback className="text-xl">
                            {(hijo.nombre?.[0] || '')}{(hijo.apellido?.[0] || '')}
                        </AvatarFallback>
                    </Avatar>
                     <h2 className="text-xl font-bold">{hijo.nombre} {hijo.apellido}</h2>
                </div>
                
                 <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                    <h3 className="font-semibold text-foreground">Paradas Principales</h3>
                    <AddressRow icon={Home} type="Recogida (Casa)" stop={paradaRecogida} />
                    <AddressRow icon={MapPin} type="Entrega (Casa)" stop={paradaEntrega} />
                </div>
                
                 <Button className="w-full" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
                    Gestionar Direcciones
                 </Button>

            </CardContent>
        </Card>
    )
}
