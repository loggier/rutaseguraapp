'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/contexts/user-context';
import { NotificationSwitch } from './notification-switch';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useUser();
    const [isSaving, setIsSaving] = useState(false);

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <PageHeader
                title="Configuración"
                description="Administra tu información personal y notificaciones."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <Card>
                    <CardHeader>
                        <CardTitle>Mi Perfil</CardTitle>
                        <CardDescription>Esta información es privada y no se comparte.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre</Label>
                                <Input id="nombre" defaultValue={user?.nombre || ''} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="apellido">Apellido</Label>
                                <Input id="apellido" defaultValue={user?.apellido || ''} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono</Label>
                            <Input id="telefono" type="tel" defaultValue={user?.telefono || ''} />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6 flex justify-between">
                        <Button variant="outline">Cambiar Contraseña</Button>
                        <Button onClick={() => setIsSaving(true)} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notificaciones</CardTitle>
                        <CardDescription>Elige qué alertas quieres recibir en tu dispositivo.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <NotificationSwitch
                            id="llegada-alumno"
                            label="Llegada por alumno"
                            description="Cuando el bus está cerca de la parada."
                            defaultChecked={true}
                        />
                        <Separator />
                        <NotificationSwitch
                            id="alumno-en-bus"
                            label="Alumno en bus"
                            description="Cuando tu hijo(a) es marcado como recogido."
                            defaultChecked={false}
                        />
                         <Separator />
                        <NotificationSwitch
                            id="llegada-colegio"
                            label="Llegada a colegio"
                            description="Cuando el bus llega al colegio."
                            defaultChecked={true}
                        />
                        <Separator />
                         <NotificationSwitch
                            id="exceso-velocidad"
                            label="Exceso de velocidad"
                            description="Si el bus excede los límites de velocidad."
                            defaultChecked={false}
                        />
                         <Separator />
                          <NotificationSwitch
                            id="salida-colegio"
                            label="Salida del colegio"
                            description="Cuando el bus inicia la ruta de regreso."
                            defaultChecked={true}
                        />
                         <Separator />
                        <NotificationSwitch
                            id="llega-casa"
                            label="Llega a casa"
                            description="Cuando tu hijo(a) es entregado en su parada."
                            defaultChecked={true}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
