'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Parada } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Home, Building, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StopCardProps = {
    parada: Parada;
}

export function StopCard({ parada }: StopCardProps) {
    const isPrincipal = parada.sub_tipo === 'Principal';

    return (
        <Card className={cn(isPrincipal && "border-primary bg-primary/5")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    {isPrincipal ? (
                        <Home className="h-5 w-5 text-primary" />
                    ) : (
                        <Building className="h-5 w-5 text-muted-foreground" />
                    )}
                    <CardTitle className="text-base font-bold">
                        {parada.sub_tipo}
                    </CardTitle>
                </div>
                <Badge variant={parada.activo ? "default" : "secondary"} className={cn(!parada.activo && "bg-gray-300 text-gray-700", "min-w-[60px] flex justify-center")}>
                    {parada.activo ? 'Activa' : 'Inactiva'}
                </Badge>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{parada.direccion}</p>
                 <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
