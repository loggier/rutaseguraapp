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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, CheckCircle, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { conductores } from "@/lib/data";

function getStatusVariant(status: string) {
  switch (status) {
    case 'activo':
      return 'default';
    case 'suspendido':
      return 'destructive';
    case 'en_revision':
      return 'secondary';
    default:
      return 'outline';
  }
}

export default function DriversPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Conductores"
        description="Administra los perfiles de los conductores, aprueba registros y asigna autobuses."
      >
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Agregar Conductor</span>
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Conductores</CardTitle>
          <CardDescription>Un total de {conductores.length} conductores registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Licencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Autobús Asignado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conductores.map((conductor) => (
                <TableRow key={conductor.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={conductor.avatarUrl} alt={`${conductor.nombre} ${conductor.apellido}`} data-ai-hint="person face" />
                        <AvatarFallback>{conductor.nombre[0]}{conductor.apellido[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        {conductor.nombre} {conductor.apellido}
                        <div className="text-sm text-muted-foreground">{conductor.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{conductor.licencia}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(conductor.estado)}>{conductor.estado}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{conductor.autobusId || 'No asignado'}</TableCell>
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
                        {conductor.estado === 'en_revision' && (
                          <>
                            <DropdownMenuItem><CheckCircle className="mr-2 h-4 w-4" />Aprobar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive"><XCircle className="mr-2 h-4 w-4" />Rechazar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Asignar Autobús</DropdownMenuItem>
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
