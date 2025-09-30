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
import { MoreHorizontal, PlusCircle, Upload, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { estudiantes } from "@/lib/data";
import { cn } from "@/lib/utils";

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

export default function StudentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Estudiantes"
        description="Administra los perfiles de los estudiantes, aprueba registros y gestiona saldos."
      >
        <Button variant="outline" size="sm" className="gap-1">
          <Upload className="h-3.5 w-3.5" />
          <span>Importar</span>
        </Button>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Agregar Estudiante</span>
        </Button>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Estudiantes</CardTitle>
          <CardDescription>Un total de {estudiantes.length} estudiantes registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Tutor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Saldo</TableHead>
                <TableHead className="hidden md:table-cell">Fecha Registro</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudiantes.map((estudiante) => (
                <TableRow key={estudiante.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={estudiante.avatarUrl} alt={`${estudiante.nombre} ${estudiante.apellido}`} data-ai-hint="child face" />
                        <AvatarFallback>{estudiante.nombre[0]}{estudiante.apellido[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        {estudiante.nombre} {estudiante.apellido}
                        <div className="text-sm text-muted-foreground">{estudiante.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{estudiante.tutor}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(estudiante.estado)}>{estudiante.estado}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{estudiante.saldo_monedas} monedas</TableCell>
                  <TableCell className="hidden md:table-cell">{estudiante.fecha_registro}</TableCell>
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
                        {estudiante.estado === 'en_revision' && (
                          <>
                            <DropdownMenuItem>Aprobar</DropdownMenuItem>
                            <DropdownMenuItem>Rechazar</DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
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
