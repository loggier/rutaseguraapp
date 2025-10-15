'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Estudiante, Parada } from "@/lib/types";
import { Info, MapPin, School, Home, Bus } from "lucide-react";
import { useParentDashboard } from "../layout";

type HijoDetailCardProps = {
    hijo: Estudiante & { paradas: Parada[], ruta_id?: string };
}

const TimelineNode = ({ icon: Icon, time, label }: { icon: React.ElementType, time: string, label: string }) => (
    <div className="flex flex-col items-center gap-1 text-center">
        <Icon className="h-6 w-6 text-primary" />
        <span className="text-xs font-bold">{time}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
    </div>
);

const TimelineConnector = () => (
    <div className="flex-1 border-t-2 border-dashed border-primary/50 self-center mb-6"></div>
);

export function HijoDetailCard({ hijo }: HijoDetailCardProps) {
    const { buses } = useParentDashboard();
    const bus = buses.find(b => b.ruta?.id === hijo.ruta_id);

    const horaSalidaManana = bus?.ruta?.hora_salida_manana;
    const horaSalidaTarde = bus?.ruta?.hora_salida_tarde;
    
    return (
        <Card className="shadow-md">
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-muted-foreground">{hijo.colegio_nombre || "Colegio No Asignado"}</p>
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
                
                <div className="space-y-4">
                    {horaSalidaManana && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                                <TimelineNode icon={Home} time={horaSalidaManana.substring(0, 5)} label="Casa" />
                                <TimelineConnector />
                                <TimelineNode icon={School} time="Llegada" label="Colegio" />
                            </div>
                            <Button className="w-full mt-3 bg-white text-secondary border-secondary/20 border-2 hover:bg-secondary/10">
                                Mañana <Bus className="ml-2 h-5 w-5"/>
                            </Button>
                        </div>
                    )}

                    {horaSalidaTarde && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                           <div className="flex justify-between items-center">
                                <TimelineNode icon={School} time={horaSalidaTarde.substring(0, 5)} label="Colegio" />
                                <TimelineConnector />
                                <TimelineNode icon={Home} time="Llegada" label="Casa" />
                            </div>
                             <Button className="w-full mt-3 bg-white text-secondary border-secondary/20 border-2 hover:bg-secondary/10">
                                Tarde <Bus className="ml-2 h-5 w-5"/>
                            </Button>
                        </div>
                    )}
                     
                     {!bus && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                            Este estudiante no tiene una ruta asignada.
                        </div>
                     )}

                     {bus && !horaSalidaManana && !horaSalidaTarde && (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                            La ruta de este estudiante no tiene horarios definidos.
                        </div>
                     )}
                </div>

            </CardContent>
        </Card>
    )
}
