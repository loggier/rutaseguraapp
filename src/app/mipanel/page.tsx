'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { useUser } from "@/contexts/user-context";

export default function MiPanelPage() {
    const { user } = useUser();

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Mi Panel"
                description={`Bienvenido, ${user?.nombre || 'usuario'}. Aquí puedes gestionar todo lo relacionado a tus hijos.`}
            />
            <Card>
                <CardHeader>
                    <CardTitle>Resumen Rápido</CardTitle>
                    <CardDescription>
                        Información principal sobre el estado actual.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>El contenido del panel principal para padres irá aquí.</p>
                </CardContent>
            </Card>
        </div>
    );
}
