'use client';

import { PageHeader } from "@/components/page-header";
import { useParentDashboard } from "../layout";
import { Loader2 } from "lucide-react";
import { HijoDetailCard } from "./hijo-detail-card";

export default function HijosPage() {
    const { hijos, loading } = useParentDashboard();

    if (loading) {
        return (
            <div className="flex flex-col gap-6 p-4 md:p-6">
                 <PageHeader
                    title="Gestión de Mis Hijos"
                    description="Visualiza la información de tus hijos y su estado."
                />
                <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <PageHeader
                title="Alumnos"
                description="Gestiona la información de tus hijos y sus rutas."
            />

            <div className="space-y-6">
                {hijos.length > 0 ? (
                    hijos.map(hijo => (
                        <HijoDetailCard key={hijo.id} hijo={hijo} />
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>No tienes hijos registrados en la plataforma.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
