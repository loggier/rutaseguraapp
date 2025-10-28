'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Parada } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Home, Building } from "lucide-react";
import { cn } from "@/lib/utils";

type StopCardProps = {
    parada: Parada;
    onEdit: (parada: Parada) => void;
}

export function StopCard({ parada, onEdit }: StopCardProps) {
    const isPrincipal = parada.sub_tipo === 'Principal';

    return (
        <Card className={cn(isPrincipal && "border-primary bg-primary/5")}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
                <div className="flex items-center gap-3">
                    {isPrincipal ? (
                        <Home className="h-5 w-5 text-primary" />
                    ) : (
                        <Building className="h-5 w-5 text-muted-foreground" />
                    )}
                    <CardTitle className="text-base font-bold">
                       {isPrincipal ? 'Principal' : 'Secundaria'}
                    </CardTitle>
                </div>
                <Badge variant={parada.activo ? "default" : "secondary"} className={cn(!parada.activo && "bg-gray-300 text-gray-700", "min-w-[65px] flex justify-center")}>
                    {parada.activo ? 'Activa' : 'Inactiva'}
                </Badge>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{parada.direccion}</p>
                 <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(parada)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
