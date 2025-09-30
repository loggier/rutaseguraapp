'use client';

import { MapPlaceholder } from "@/components/map-placeholder";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { autobuses } from "@/lib/data";
import { Bus, User } from "lucide-react";

function getStatusVariant(status: string) {
  switch (status) {
    case 'en_ruta':
      return 'default';
    case 'detenido':
      return 'secondary';
    case 'mantenimiento':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function TrackingPage() {
  const activeBuses = autobuses.filter(bus => bus.estado === 'en_ruta' || bus.estado === 'detenido');

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 h-[calc(100vh-10rem)]">
        <MapPlaceholder />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Autobuses Activos</CardTitle>
          <CardDescription>Seguimiento de autobuses en operación.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Autobús</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeBuses.map((bus) => (
                <TableRow key={bus.id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2"><Bus className="w-4 h-4 text-muted-foreground"/> {bus.matricula}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> {bus.conductorNombre}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(bus.estado)}>
                      {bus.estado.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
