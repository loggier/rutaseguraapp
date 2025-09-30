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
import { MoreHorizontal, PlusCircle, Bus, User } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { autobuses } from "@/lib/data";

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

export default function BusesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Autobuses"
        description="Administra la flota de autobuses, su capacidad y estado."
      >
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Agregar Autobús</span>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Flota de Autobuses</CardTitle>
          <CardDescription>Un total de {autobuses.length} autobuses en la flota.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead className="hidden md:table-cell">Conductor Asignado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {autobuses.map((autobus) => (
                <TableRow key={autobus.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Bus className="h-5 w-5 text-muted-foreground" />
                      <span>{autobus.matricula}</span>
                    </div>
                  </TableCell>
                  <TableCell>{autobus.capacidad} pasajeros</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {autobus.conductorNombre ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{autobus.conductorNombre}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No asignado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(autobus.estado)}>{autobus.estado.replace('_', ' ')}</Badge>
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
                        <DropdownMenuItem>Asignar Conductor</DropdownMenuItem>
                        <DropdownMenuItem>Ver Mantenimientos</DropdownMenuItem>
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
