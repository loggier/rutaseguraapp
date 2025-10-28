'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/contexts/user-context';
import { NotificationSwitch } from './notification-switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Camera } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ImageCropper } from '../hijos/[id]/direcciones/image-cropper';

export default function SettingsPage() {
    const { user, setUser } = useUser();
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const [isUploading, setIsUploading] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            
            // Actualizar el estado del usuario local y el localStorage
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
