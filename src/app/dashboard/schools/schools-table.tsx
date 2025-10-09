'use client';

import { useState } from "react";
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
import { MoreHorizontal, School, Edit, UserCheck, UserX, Trash2 } from "lucide-react";
import type { Colegio } from "@/lib/types";
import { EditSchoolDialog } from "./edit-school-dialog";
import { UpdateSchoolStatusAlert } from "./update-school-status-alert";
import { DeleteSchoolAlert } from "./delete-school-alert";

type SchoolsTableProps = {
    colegios: Colegio[];
    onSchoolUpdated: (updatedSchool: Colegio) => void;
    onSchoolStatusChanged: (schoolId: string, newStatus: boolean) => void;
    onSchoolDeleted: (schoolId: string) => void;
}

export function SchoolsTable({ colegios, onSchoolUpdated, onSchoolStatusChanged, onSchoolDeleted }: SchoolsTableProps) {

    return (
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
                <TableRow key={colegio.id} className={!colegio.activo ? 'bg-muted/50' : ''}>
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
                        <EditSchoolDialog school={colegio} onSchoolUpdated={onSchoolUpdated}>
                            <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Editar</span>
                            </div>
                        </EditSchoolDialog>
                        <UpdateSchoolStatusAlert 
                            school={colegio} 
                            onSchoolStatusChanged={onSchoolStatusChanged}
                        >
                            {colegio.activo ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            <span>{colegio.activo ? 'Desactivar' : 'Activar'}</span>
                        </UpdateSchoolStatusAlert>
                        <DropdownMenuSeparator />
                        <DeleteSchoolAlert school={colegio} onSchoolDeleted={onSchoolDeleted}>
                             <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar</span>
                            </div>
                        </DeleteSchoolAlert>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
    );
}
