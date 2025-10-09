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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Estudiante } from "@/lib/types";
import { DeleteStudentAlert } from "./delete-student-alert";
import { EditStudentDialog } from "./edit-student-dialog";

type StudentsTableProps = {
    students: Estudiante[];
    onStudentUpdated: (updatedStudent: Estudiante) => void;
    onStudentDeleted: (studentId: string) => void;
}

export function StudentsTable({ students, onStudentUpdated, onStudentDeleted }: StudentsTableProps) {
    const [studentToDelete, setStudentToDelete] = useState<Estudiante | null>(null);

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Estudiante</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Padre/Tutor</TableHead>
                        <TableHead className="hidden md:table-cell">Colegio</TableHead>
                        <TableHead>
                            <span className="sr-only">Acciones</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {students.map((student) => (
                    <TableRow key={student.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{(student.nombre?.[0] || '')}{(student.apellido?.[0] || '')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    {student.nombre} {student.apellido}
                                    <div className="text-sm text-muted-foreground">{student.email}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <span className="font-mono text-xs">{student.student_id}</span>
                        </TableCell>
                        <TableCell>
                            <div>{student.padre_nombre}</div>
                            <div className="text-sm text-muted-foreground">{student.padre_email}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{student.colegio_nombre}</TableCell>
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
                                <EditStudentDialog student={student} onStudentUpdated={onStudentUpdated}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                </EditStudentDialog>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className='text-destructive'
                                    onClick={() => setStudentToDelete(student)}
                                >
                                <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            
            {studentToDelete && (
                <DeleteStudentAlert
                    student={studentToDelete}
                    isOpen={!!studentToDelete}
                    onClose={() => setStudentToDelete(null)}
                    onStudentDeleted={onStudentDeleted}
                />
            )}
        </>
    );
}
