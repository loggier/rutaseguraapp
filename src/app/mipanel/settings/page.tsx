'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default function SettingsPage() {

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Configuración de Cuenta"
                description="Administra tu información personal y notificaciones."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Mi Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>El formulario de configuración para padres irá aquí.</p>
                </CardContent>
            </Card>
        </div>
    );
}
