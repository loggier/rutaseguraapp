'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default function HijosPage() {

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Gestión de Mis Hijos"
                description="Visualiza la información de tus hijos y su estado."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Mis Hijos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>La lista de hijos del padre/tutor irá aquí.</p>
                </CardContent>
            </Card>
        </div>
    );
}
