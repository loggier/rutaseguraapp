'use client';

import { PageHeader } from "@/components/page-header";
import { useParentDashboard } from "@/app/mipanel/layout";
import { Loader2, PlusCircle, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { StopCard } from "./stop-card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function GestionarDireccionesPage() {
    const { hijos, loading } = useParentDashboard();
    const params = useParams();
    const router = useRouter();
    const studentId = params.id as string;

    const hijo = useMemo(() => {
        if (!loading && studentId) {
            return hijos.find(h => h.id === studentId);
        }
        return null;
    }, [hijos, loading, studentId]);

    const paradasRecogida = useMemo(() => {
        return hijo?.paradas?.filter(p => p.tipo === 'Recogida').sort((a,b) => (a.sub_tipo === 'Principal' ? -1 : 1)) || [];
    }, [hijo]);

    const paradasEntrega = useMemo(() => {
        return hijo?.paradas?.filter(p => p.tipo === 'Entrega').sort((a,b) => (a.sub_tipo === 'Principal' ? -1 : 1)) || [];
    }, [hijo]);

    if (loading) {
        return (
            <div className="flex flex-1 h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando datos del estudiante...</p>
            </div>
        );
    }
    
    if (!hijo) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                 <p className="text-destructive font-semibold">Estudiante no encontrado.</p>
                 <Button onClick={() => router.back()} variant="link">Volver</Button>
            </div>
        )
    }

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={`Direcciones de ${hijo.nombre}`}
                    description="Gestiona las paradas de recogida y entrega."
                >
                     <Button asChild variant="outline">
                        <Link href="/mipanel/hijos">
                            <ArrowLeft className="mr-2" />
                            Volver
                        </Link>
                    </Button>
                </PageHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Columna de Recogida */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Recogida</h2>
                            <Button variant="ghost" size="sm">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir
                            </Button>
                        </div>
                        <Separator />
                        {paradasRecogida.length > 0 ? (
                           <div className="space-y-4">
                             {paradasRecogida.map(parada => <StopCard key={parada.id} parada={parada} />)}
                           </div>
                        ) : (
                            <p className="text-sm text-muted-foreground pt-4 text-center">No hay paradas de recogida configuradas.</p>
                        )}
                    </div>
                    
                    {/* Columna de Entrega */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <h2 className="text-xl font-bold">Entrega</h2>
                            <Button variant="ghost" size="sm">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir
                            </Button>
                        </div>
                         <Separator />
                         {paradasEntrega.length > 0 ? (
                           <div className="space-y-4">
                             {paradasEntrega.map(parada => <StopCard key={parada.id} parada={parada} />)}
                           </div>
                        ) : (
                            <p className="text-sm text-muted-foreground pt-4 text-center">No hay paradas de entrega configuradas.</p>
                        )}
                    </div>
                </div>

            </div>
        </ScrollArea>
    );
}