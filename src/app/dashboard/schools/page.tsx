
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
import { MoreHorizontal, PlusCircle, School } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { colegios } from "@/lib/data";

export default function SchoolsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Colegios"
        description="Administra las cuentas de los colegios, sus datos y usuarios asociados."
      >
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Agregar Colegio</span>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Colegios</CardTitle>
          <CardDescription>Un total de {colegios.length} colegios registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Colegio</TableHead>
                <TableHead>RUC</TableHead>
                <TableHead className="hidden md:table-cell">Contacto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colegios.map((colegio) => (
                <TableRow key={colegio.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <School className="h-5 w-5 text-muted-foreground" />
                      <div>
                        {colegio.nombre}
                         <div className="text-sm text-muted-foreground">{colegio.direccion}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{colegio.ruc}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      {colegio.email_contacto}
                      <div className="text-sm text-muted-foreground">{colegio.telefono}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={colegio.activo ? 'default' : 'secondary'}>
                      {colegio.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Gestionar Usuarios</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Desactivar
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


    