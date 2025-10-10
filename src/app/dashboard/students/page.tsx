'use client';

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Estudiante } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { StudentsTable } from "./students-table";
import { Loader2, PlusCircle } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StudentsPage() {
  const [students, setStudents] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase.from('estudiantes').select(`
        *,
        padre:profiles(id, nombre, apellido, user:users(email)),
        colegio:colegios(nombre)
      `);

      if (user.rol === 'colegio') {
         const { data: currentColegio, error: colegioError } = await supabase
            .from('colegios')
            .select('id')
            .eq('usuario_id', user.id)
            .single();

        if (colegioError || !currentColegio) {
            throw new Error('No se pudo encontrar el colegio para este usuario.');
        }
        query = query.eq('colegio_id', currentColegio.id);
      }

      const { data: studentsData, error: studentsError } = await query.order('apellido').order('nombre');

      if (studentsError) throw studentsError;

      const formattedStudents = studentsData.map((s: any) => ({
        ...s,
        padre_nombre: s.padre ? `${s.padre.nombre} ${s.padre.apellido}` : 'No asignado',
        padre_email: s.padre?.user ? s.padre.user.email : '-',
        colegio_nombre: s.colegio ? s.colegio.nombre : 'No asignado'
      }));

      setStudents(formattedStudents);

    } catch (err: any) {
      console.error("Error cargando estudiantes:", err);
      setError(`No se pudieron cargar los estudiantes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user, fetchStudents]);

  const handleStudentDeleted = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
  }

  const canManage = user?.rol === 'master' || user?.rol === 'manager' || user?.rol === 'colegio';

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando...</p>
        </div>
    );
  }

  if (!canManage) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No tienes permiso para ver esta página.</p>
            </CardContent>
        </Card>
    )
  }
  
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión de Estudiantes"
        description="Administra los perfiles de los estudiantes y su información."
      >
        {canManage && (
            <Button asChild size="sm" className="gap-1">
                <Link href="/dashboard/students/add">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Agregar Estudiante</span>
                </Link>
            </Button>
        )}
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Estudiantes</CardTitle>
          <CardDescription>Un total de {students.length} estudiantes registrados.</CardDescription>
        </CardHeader>
        <CardContent>
           {error ? (
            <div className="text-center text-destructive py-8">{error}</div>
           ) : (
             <StudentsTable 
                students={students}
                onStudentDeleted={handleStudentDeleted}
              />
           )}
        </CardContent>
      </Card>
    </div>
  );
}
