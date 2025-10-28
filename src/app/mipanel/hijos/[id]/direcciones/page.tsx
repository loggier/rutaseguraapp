'use client';

import { PageHeader } from "@/components/page-header";
import { useParentDashboard } from "@/app/mipanel/layout";
import { Loader2, PlusCircle, ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useCallback, startTransition } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { StopCard } from "./stop-card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { EditStopSheet } from "./edit-stop-sheet";
import { AddStopSheet } from "./add-stop-sheet";
import type { Parada } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const libraries: ('places')[] = ['places'];

export default function GestionarDireccionesPage() {
    const { hijos, loading, refreshData } = useParentDashboard();
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const studentId = params.id as string;

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    const [editingStop, setEditingStop] = useState<Parada | null>(null);
    const [addingStopType, setAddingStopType] = useState<'Recogida' | 'Entrega' | null>(null);
    const [deletingStopId, setDeletingStopId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const hijo = useMemo(() => {
        if (!loading && studentId) {
            return hijos.find(h => h.id === studentId);
        }
        return null;
    }, [hijos, loading, studentId]);

    const handleEdit = useCallback((parada: Parada) => {
        setEditingStop(parada);
    }, []);

    const handleDeleteRequest = useCallback((stopId: string) => {
        setDeletingStopId(stopId);
    }, []);

    const handleConfirmDelete = async () => {
        if (!deletingStopId) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/stops/${deletingStopId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Ocurrió un error al eliminar la parada.');
            }

            toast({
                title: "Éxito",
                description: "La parada se ha eliminado correctamente.",
            });
            
            startTransition(() => {
                refreshData();
                router.refresh(); 
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error al Eliminar",
                description: error.message,
            });
        } finally {
            setIsDeleting(false);
            setDeletingStopId(null);
        }
    };

    const handleCloseSheet = useCallback((updated?: boolean) => {
        setEditingStop(null);
        setAddingStopType(null);
        if (updated) {
            startTransition(() => {
                refreshData();
                router.refresh(); 
            });
        }
    }, [router, refreshData]);

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
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                 <p className="text-destructive font-semibold mb-4">Estudiante no encontrado.</p>
                 <Button onClick={() => router.back()} variant="link">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
            </div>
        )
    }

    return (
        <>
            <ScrollArea className="h-full">
                <div className="flex flex-col gap-6 p-4 md:p-6">
                    <PageHeader
                        title={`Direcciones de ${hijo.nombre}`}
                        description="Gestiona las paradas de recogida y entrega."
                    >
                         <Button asChild variant="outline" size="sm">
                            <Link href="/mipanel/hijos">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Link>
                        </Button>
                    </PageHeader>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Columna de Recogida */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Recogida</h2>
                                <Button variant="ghost" size="sm" onClick={() => setAddingStopType('Recogida')}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir
                                </Button>
                            </div>
                            <Separator />
                            {paradasRecogida.length > 0 ? (
                               <div className="space-y-4">
                                 {paradasRecogida.map(parada => <StopCard key={parada.id} parada={parada} onEdit={handleEdit} onDelete={handleDeleteRequest} />)}
                               </div>
                            ) : (
                                <p className="text-sm text-muted-foreground pt-4 text-center">No hay paradas de recogida configuradas.</p>
                            )}
                        </div>
                        
                        {/* Columna de Entrega */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                               <h2 className="text-xl font-bold">Entrega</h2>
                                <Button variant="ghost" size="sm" onClick={() => setAddingStopType('Entrega')}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Añadir
                                </Button>
                            </div>
                             <Separator />
                             {paradasEntrega.length > 0 ? (
                               <div className="space-y-4">
                                 {paradasEntrega.map(parada => <StopCard key={parada.id} parada={parada} onEdit={handleEdit} onDelete={handleDeleteRequest} />)}
                               </div>
                            ) : (
                                <p className="text-sm text-muted-foreground pt-4 text-center">No hay paradas de entrega configuradas.</p>
                            )}
                        </div>
                    </div>

                </div>
            </ScrollArea>
            {editingStop && (
                <EditStopSheet
                    isOpen={!!editingStop}
                    parada={editingStop}
                    onClose={handleCloseSheet}
                    isLoaded={isLoaded}
                    loadError={loadError}
                />
            )}
            {addingStopType && (
                <AddStopSheet
                    isOpen={!!addingStopType}
                    tipo={addingStopType}
                    studentId={hijo.id}
                    colegioId={hijo.colegio_id}
                    onClose={handleCloseSheet}
                    isLoaded={isLoaded}
                    loadError={loadError}
                />
            )}
             <AlertDialog open={!!deletingStopId} onOpenChange={(open) => !open && setDeletingStopId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la parada de los registros.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
