'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default function MapaPage() {

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Mapa en Vivo"
                description="Sigue la ubicación de los autobuses en tiempo real."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Seguimiento</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>El componente del mapa para padres irá aquí.</p>
                </CardContent>
            </Card>
        </div>
    );
}
