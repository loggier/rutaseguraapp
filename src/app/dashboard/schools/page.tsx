'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, School, Loader2 } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import type { Colegio } from '@/lib/types';
import { AddSchoolDialog } from './add-school-dialog';

export default function SchoolsPage() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchColegios() {
      const supabase = createClient();
      // Consultamos la VISTA 'colegios_view' que ya tiene el email unido.
      const { data, error } = await supabase
        .from('colegios_view')
        .select('*');

      if (error) {
        console.error("Error cargando colegios desde la vista:", error);
        setError("No se pudieron cargar los colegios.");
      } else {
        // Los datos ya vienen aplanados desde la vista, por lo que el mapeo es directo.
        setColegios(data as Colegio[]);
      }
      setLoading(false);
    }

    fetchColegios();
  }, []);

  const handleSchoolAdded = (newSchool: Colegio) => {
    // Para que el nuevo colegio aparezca con su email, lo ideal es volver a cargar los datos
    // o añadirlo con el email que ya viene en la respuesta de la API.
    setColegios(prev => [{...newSchool},...prev ]);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Colegios"
        description="Administra las cuentas de los colegios, sus datos y usuarios asociados."
      >
        <AddSchoolDialog onSchoolAdded={handleSchoolAdded} />
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Colegios</CardTitle>
          <CardDescription>Un total de {colegios.length} colegios registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Cargando colegios...</p>
            </div>
          ) : error ? (
             <div className="text-center text-destructive">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Colegio</TableHead>
                  <TableHead>Email Cuenta</TableHead>
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
                    <TableCell>{colegio.email}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
