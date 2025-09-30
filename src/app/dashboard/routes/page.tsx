'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Route, Users, MapPin, Sunrise, Sunset } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { rutas } from "@/lib/data";

export default function RoutesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Rutas"
        description="Crea, visualiza y administra las rutas de los autobuses."
      >
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Crear Ruta</span>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Rutas</CardTitle>
          <CardDescription>Un total de {rutas.length} rutas configuradas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre de la Ruta</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead className="hidden md:table-cell">Paradas</TableHead>
                <TableHead className="hidden md:table-cell">Estudiantes</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rutas.map((ruta) => (
                <TableRow key={ruta.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Route className="h-5 w-5 text-muted-foreground" />
                      <span>{ruta.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ruta.turno === 'mañana' ? 'outline' : 'secondary'} className="gap-1">
                      {ruta.turno === 'mañana' ? <Sunrise className="h-3 w-3"/> : <Sunset className="h-3 w-3" />}
                      {ruta.turno.charAt(0).toUpperCase() + ruta.turno.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {ruta.paradas_count}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {ruta.estudiantes_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>Editar Ruta</DropdownMenuItem>
                        <DropdownMenuItem>Gestionar Paradas</DropdownMenuItem>
                        <DropdownMenuItem>Asignar Viaje</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
