'use client';

import { useEffect, useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { updateRouteAssignments, type State } from './actions';
import type { Ruta, Estudiante, Parada } from '@/lib/types';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Combobox, ComboboxItem } from '@/components/ui/combobox';

type ManageStudentsFormProps = {
  route: Ruta;
  initialAssignedStudents: (Estudiante & { paradas: Parada[] })[];
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

export function ManageStudentsForm({ route, initialAssignedStudents }: ManageStudentsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [assignedStudents, setAssignedStudents] = useState(initialAssignedStudents);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ComboboxItem[]>([]);

  const initialState: State = { message: null, errors: {} };
  const updateRouteAssignmentsWithRoute = updateRouteAssignments.bind(null, route);
  const [state, formAction] = useActionState(updateRouteAssignmentsWithRoute, initialState);

  useEffect(() => {
    if (state?.message) {
      toast({
        variant: state.message.startsWith('Error') ? "destructive" : "default",
        title: state.message.startsWith('Error') ? "Error" : "Notificación",
        description: state.message,
      });
    }
  }, [state, toast]);

  const handleSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`/api/students/search?query=${searchTerm}&colegioId=${route.colegio_id}`);
      const data: Estudiante[] = await response.json();
      const assignedIds = new Set(assignedStudents.map(s => s.id));
      const filteredResults = data
        .filter(student => !assignedIds.has(student.id))
        .map(student => ({
          value: student.id,
          label: `${student.nombre} ${student.apellido} (${student.student_id})`
        }));
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search failed:', error);
      toast({ variant: 'destructive', title: 'Error de Búsqueda', description: 'No se pudieron obtener los estudiantes.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStudent = async (studentId: string | null) => {
    if (!studentId) return;

    // Fetch the full student object to check for active stops
    try {
        const response = await fetch(`/api/students/search?id=${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch student details');
        
        const studentData = await response.json();
        const student: Estudiante & { paradas: Parada[] } = studentData[0];
    
        if (student) {
            setAssignedStudents(prev => [...prev, student]);
            setSearchResults([]); // Clear search results
        }
    } catch (error) {
        console.error('Failed to select student:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo agregar al estudiante.' });
    }
  };
  
  const handleRemoveStudent = (studentId: string) => {
    setAssignedStudents(prev => prev.filter(s => s.id !== studentId));
  };
  
  return (
    <form action={formAction} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <h3 className="font-medium md:col-span-2">Buscar y Agregar Estudiantes</h3>
         <Combobox
            items={searchResults}
            value={null}
            onChange={handleSelectStudent}
            onSearch={handleSearch}
            placeholder="Buscar estudiante por nombre, apellido o ID..."
            searchPlaceholder="Escribe para buscar..."
            notFoundMessage={isSearching ? 'Buscando...' : 'No se encontraron estudiantes.'}
        />
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Estudiantes Asignados a la Ruta ({assignedStudents.length})</h3>
        <div className="rounded-md border max-h-[50vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Parada Activa ({route.turno})</TableHead>
                <TableHead className="w-[50px] text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedStudents.length > 0 ? assignedStudents.map(student => {
                const activeStop = student.paradas?.find(p => p.activo && p.tipo === route.turno);
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarImage src={student.avatar_url || ''} alt={`${student.nombre} ${student.apellido}`} data-ai-hint="child face" />
                              <AvatarFallback>{(student.nombre?.[0] || '')}{(student.apellido?.[0] || '')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{student.nombre} {student.apellido}</span>
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
                    <TableCell className="text-right">
                       <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStudent(student.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                  <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                          Aún no hay estudiantes asignados a esta ruta.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {assignedStudents.map(student => (
        <input type="hidden" key={student.id} name="student_ids" value={student.id} />
      ))}

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <SubmitButton />
      </div>
    </form>
  );
}
