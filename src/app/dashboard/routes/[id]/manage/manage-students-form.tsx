
'use client';

import { useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { updateRouteAssignments, type State } from './actions';
import type { Ruta, Estudiante, Parada } from '@/lib/types';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

type ManageStudentsFormProps = {
  route: Ruta;
  allStudents: (Estudiante & { paradas: Parada[] })[];
  assignedStudentIds: string[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Guardar Cambios
    </Button>
  );
}

export function ManageStudentsForm({ route, allStudents, assignedStudentIds }: ManageStudentsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const initialState: State = { message: null, errors: {} };
  const updateRouteAssignmentsWithContext = updateRouteAssignments.bind(null, route, allStudents);
  const [state, formAction] = useActionState(updateRouteAssignmentsWithContext, initialState);

  useEffect(() => {
    if (state?.message) {
      toast({
        variant: state.message.startsWith('Error') || state.message.startsWith('Asignación parcial') ? "destructive" : "default",
        title: state.message.startsWith('Error') ? "Error" : "Notificación",
        description: state.message,
        duration: state.message.startsWith('Asignación parcial') ? 8000 : 5000,
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-md border max-h-[60vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead>Parada Activa ({route.turno})</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStudents.length > 0 ? allStudents.map(student => {
              const activeStop = student.paradas.find(p => p.activo && p.tipo === route.turno);
              const isChecked = assignedStudentIds.includes(student.id);

              return (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      id={`student-${student.id}`}
                      name="student_ids"
                      value={student.id}
                      defaultChecked={isChecked}
                      disabled={!activeStop && !isChecked}
                    />
                  </TableCell>
                  <TableCell>
                     <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={student.avatar_url || ''} alt={`${student.nombre} ${student.apellido}`} data-ai-hint="child face" />
                            <AvatarFallback>{(student.nombre?.[0] || '')}{(student.apellido?.[0] || '')}</AvatarFallback>
                        </Avatar>
                        <div>
                           <label htmlFor={`student-${student.id}`} className="font-medium cursor-pointer">{student.nombre} {student.apellido}</label>
                           <div className="text-sm text-muted-foreground">{student.student_id}</div>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {activeStop ? (
                       <Badge variant="outline">{activeStop.direccion}</Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1.5 items-center">
                        <AlertCircle className="h-3 w-3" />
                        Sin parada activa
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            }) : (
                <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                        No hay estudiantes en este colegio.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <SubmitButton />
      </div>
    </form>
  );
}
