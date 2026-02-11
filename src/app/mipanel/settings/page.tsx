
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/contexts/user-context';
import { NotificationSwitch } from './notification-switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Camera, BellRing, BellOff, HelpCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ImageCropper } from '../hijos/[id]/direcciones/image-cropper';
import type { NotificationSettings } from '@/lib/types';
import { useFirebaseMessaging } from '@/components/firebase-messaging-provider';


const notificationOptions = [
    { id: "llegada-alumno", label: "Llegada por alumno", description: "Cuando el bus está cerca de la parada.", defaultChecked: true },
    { id: "alumno-en-bus", label: "Alumno en bus", description: "Cuando tu hijo(a) es marcado como recogido.", defaultChecked: false },
    { id: "llegada-colegio", label: "Llegada a colegio", description: "Cuando el bus llega al colegio.", defaultChecked: true },
    { id: "exceso-velocidad", label: "Exceso de velocidad", description: "Si el bus excede los límites de velocidad.", defaultChecked: false },
    { id: "salida-colegio", label: "Salida del colegio", description: "Cuando el bus inicia la ruta de regreso.", defaultChecked: true },
    { id: "llega-casa", label: "Llega a casa", description: "Cuando tu hijo(a) es entregado en su parada.", defaultChecked: true },
];

const getDefaultNotificationSettings = (): NotificationSettings => {
    return notificationOptions.reduce((acc, opt) => {
        acc[opt.id] = opt.defaultChecked;
        return acc;
    }, {} as NotificationSettings);
}


export default function SettingsPage() {
    const { user, setUser } = useUser();
    const { toast } = useToast();
    
    // State for user profile fields
    const [nombre, setNombre] = useState(user?.nombre || '');
    const [apellido, setApellido] = useState(user?.apellido || '');
    const [telefono, setTelefono] = useState(user?.telefono || '');

    // State for notification settings
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
        user?.notification_settings || getDefaultNotificationSettings()
    );

    // State for UI
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- New states and hooks for push notifications ---
    const { permission, requestPermission } = useFirebaseMessaging();
    const [isRequesting, setIsRequesting] = useState(false);
    // --- End new states ---


    // Sync state if user context changes
    useEffect(() => {
        if(user) {
            setNombre(user.nombre || '');
            setApellido(user.apellido || '');
            setTelefono(user.telefono || '');
            setNotificationSettings(user.notification_settings || getDefaultNotificationSettings());
        }
    }, [user]);

    const getAvatarFallback = () => {
        if (!user) return "AD";
        const name = user.nombre;
        if (name && typeof name === 'string' && user.apellido) {
            return (user.nombre[0] + user.apellido[0]).toUpperCase();
        }
        return (user.email || '').substring(0, 2).toUpperCase();
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageToCrop(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCroppedImage = async (croppedImageBlob: Blob | null) => {
        setImageToCrop(null); 
        if (!croppedImageBlob || !user) {
             if (fileInputRef.current) fileInputRef.current.value = "";
             return;
        };

        setIsUploading(true);
        const supabase = createClient();

        try {
            const filePath = `avatars/profile-${user.id}-${Date.now()}`;
            const { error: uploadError } = await supabase.storage
                .from('rutasegura')
                .upload(filePath, croppedImageBlob, {
                    contentType: croppedImageBlob.type,
                    upsert: true,
                });
            
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('rutasegura')
                .getPublicUrl(filePath);

            if (!publicUrl) {
                throw new Error("No se pudo obtener la URL pública de la imagen.");
            }
            
            const avatarUpdatePayload = { avatar_url: publicUrl };

            const response = await fetch(`/api/profile/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(avatarUpdatePayload)
            });

            const result = await response.json();
            if(!response.ok) throw new Error(result.message || "Error al actualizar la foto de perfil.");
            
            const updatedUser = { ...user, avatar_url: publicUrl };
            setUser(updatedUser);
            localStorage.setItem('supabase_session', JSON.stringify(updatedUser));


            toast({
                title: "Éxito",
                description: "Tu foto de perfil se ha actualizado correctamente.",
            });

        } catch (error: any) {
            console.error("Error al actualizar el avatar:", error);
            toast({
                variant: "destructive",
                title: "Error al Subir Imagen",
                description: error.message || "No se pudo actualizar la foto de perfil.",
            });
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        
        try {
            // Save profile data
            const profilePromise = fetch(`/api/profile/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, apellido, telefono }),
            });
            
            // Save notification settings
            const notificationsPromise = fetch(`/api/profile/${user.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_settings: notificationSettings }),
            });
            
            const [profileResponse, notificationsResponse] = await Promise.all([profilePromise, notificationsPromise]);
            
            if (!profileResponse.ok || !notificationsResponse.ok) {
                const profileError = !profileResponse.ok ? await profileResponse.json() : null;
                const notificationsError = !notificationsResponse.ok ? await notificationsResponse.json() : null;
                throw new Error(profileError?.message || notificationsError?.message || "Ocurrió un error al guardar.");
            }
            
            const updatedUser = {
                ...user,
                nombre,
                apellido,
                telefono,
                notification_settings: notificationSettings,
            };

            setUser(updatedUser);
            localStorage.setItem('supabase_session', JSON.stringify(updatedUser));
            
            toast({
                title: "Éxito",
                description: "Tu configuración se ha guardado correctamente.",
            });
            
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Error al Guardar",
                description: error.message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleNotificationChange = (id: string, checked: boolean) => {
        setNotificationSettings(prev => ({ ...prev, [id]: checked }));
    }

    // --- New handler for requesting permission ---
    const handleRequestPermission = async () => {
        setIsRequesting(true);
        await requestPermission();
        // The permission state will update via the context, re-rendering the component
        setIsRequesting(false);
    };

    const renderPermissionStatus = () => {
        switch (permission) {
            case 'granted':
                return (
                    <div className="flex items-center text-green-600">
                        <BellRing className="mr-2 h-5 w-5" />
                        <span className="font-medium">Las notificaciones push están activadas.</span>
                    </div>
                );
            case 'denied':
                return (
                    <div className="flex items-start text-destructive">
                        <BellOff className="mr-2 h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                             <span className="font-medium">Las notificaciones push están bloqueadas.</span>
                             <p className="text-xs">Para activarlas, debes cambiar los permisos en la configuración de tu navegador o dispositivo.</p>
                        </div>
                    </div>
                );
            default:
                return (
                     <div className="flex items-center justify-between">
                         <div className="flex items-center text-muted-foreground">
                            <HelpCircle className="mr-2 h-5 w-5" />
                            <span className="font-medium">Activa las notificaciones push.</span>
                         </div>
                        <Button onClick={handleRequestPermission} disabled={isRequesting} size="sm">
                            {isRequesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Activar
                        </Button>
                    </div>
                );
        }
    }


    return (
        <>
            <ScrollArea className='h-full'>
                <div className="flex flex-col gap-6 p-4 md:p-6">
                    <PageHeader
                        title="Configuración"
                        description="Administra tu información personal y notificaciones."
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        <Card>
                            <CardHeader className="flex flex-row items-start gap-4">
                                <div className="relative group flex-shrink-0">
                                    <Avatar className="h-20 w-20 border-2">
                                        <AvatarImage src={user?.avatar_url || ''} data-ai-hint="person face" />
                                        <AvatarFallback className="text-2xl">{getAvatarFallback()}</AvatarFallback>
                                    </Avatar>
                                    <button
                                        onClick={handleAvatarClick}
                                        disabled={isUploading}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                                        ) : (
                                            <Camera className="h-8 w-8 text-white" />
                                        )}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange}
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/gif"
                                    />
                                </div>
                                <div className='flex-1'>
                                    <CardTitle>Mi Perfil</CardTitle>
                                    <CardDescription>Esta información es privada y no se comparte.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre">Nombre</Label>
                                        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="apellido">Apellido</Label>
                                        <Input id="apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input id="email" type="email" value={user?.email || ''} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input id="telefono" type="tel" value={telefono || ''} onChange={(e) => setTelefono(e.target.value)} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Notificaciones</CardTitle>
                                <CardDescription>Gestiona los permisos y alertas que recibes.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Card className="bg-muted/20">
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-base">Permiso de Notificaciones Push</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                        {renderPermissionStatus()}
                                    </CardContent>
                                </Card>

                                <Separator/>

                                <div className="space-y-2">
                                     <p className="text-base font-semibold">Tipos de Alerta</p>
                                    {notificationOptions.map((opt, index) => (
                                        <React.Fragment key={opt.id}>
                                            <NotificationSwitch
                                                id={opt.id}
                                                label={opt.label}
                                                description={opt.description}
                                                checked={notificationSettings[opt.id] ?? opt.defaultChecked}
                                                onCheckedChange={(checked) => handleNotificationChange(opt.id, checked)}
                                            />
                                            {index < notificationOptions.length - 1 && <Separator />}
                                        </React.Fragment>
                                    ))}
                                </div>

                            </CardContent>
                        </Card>
                    </div>

                     <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
            </ScrollArea>
             {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCroppedImage}
                    onClose={() => setImageToCrop(null)}
                />
            )}
        </>
    );
}
