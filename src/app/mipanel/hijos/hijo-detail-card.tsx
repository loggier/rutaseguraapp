'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Estudiante, Parada } from "@/lib/types";
import { MapPin, School, Home, Edit, Camera, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useParentDashboard } from "../layout";
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageCropper } from './[id]/direcciones/image-cropper';

type HijoDetailCardProps = {
    hijo: Estudiante & { paradas: Parada[], ruta_id?: string, padre_id: string };
}

const AddressRow = ({ icon: Icon, type, stop }: { icon: React.ElementType, type: string, stop: Parada | undefined }) => (
    <div className="flex items-start gap-3 text-sm">
        <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
        <div className="flex-1">
            <p className="font-semibold text-foreground">{type}</p>
            {stop ? (
                <p className="text-muted-foreground">{stop.direccion}</p>
            ) : (
                <p className="text-muted-foreground text-xs">No hay parada principal configurada.</p>
            )}
        </div>
    </div>
);


export function HijoDetailCard({ hijo }: HijoDetailCardProps) {
    const paradaRecogida = hijo.paradas.find(p => p.tipo === 'Recogida' && p.sub_tipo === 'Principal');
    const paradaEntrega = hijo.paradas.find(p => p.tipo === 'Entrega' && p.sub_tipo === 'Principal');
    const { refreshData } = useParentDashboard();
    const { toast } = useToast();
    
    const [isUploading, setIsUploading] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        setImageToCrop(null); // Cierra el modal
        if (!croppedImageBlob) {
             if (fileInputRef.current) fileInputRef.current.value = "";
             return;
        };

        setIsUploading(true);
        const supabase = createClient();

        try {
            // 1. Subir la imagen recortada a Supabase Storage
            const filePath = `avatars/student-${hijo.id}-${Date.now()}`;
            const { error: uploadError } = await supabase.storage
                .from('rutasegura')
                .upload(filePath, croppedImageBlob, {
                    contentType: croppedImageBlob.type,
                    upsert: true,
                });
            
            if (uploadError) throw uploadError;

            // 2. Obtener la URL pública de la imagen
            const { data: { publicUrl } } = supabase.storage
                .from('rutasegura')
                .getPublicUrl(filePath);

            if (!publicUrl) {
                throw new Error("No se pudo obtener la URL pública de la imagen.");
            }
            
            // 3. Actualizar solo el avatar usando el método PATCH
            const avatarUpdatePayload = {
                avatar_url: publicUrl,
            };

            const response = await fetch(`/api/students/${hijo.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(avatarUpdatePayload)
            });

            const result = await response.json();
            if(!response.ok) throw new Error(result.message || "Error al actualizar la foto de perfil.");

            toast({
                title: "Éxito",
                description: "La foto de perfil se ha actualizado correctamente.",
            });

            refreshData(); // Actualiza los datos de todo el dashboard

        } catch (error: any) {
            console.error("Error al actualizar el avatar:", error);
            toast({
                variant: "destructive",
                title: "Error al Subir Imagen",
                description: error.message || "No se pudo actualizar la foto de perfil.",
            });
        } finally {
            setIsUploading(false);
             // Reset input para permitir la subida del mismo archivo otra vez
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    return (
        <>
            <Card className="shadow-md">
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <School className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-semibold text-muted-foreground">{hijo.colegio_nombre || "Colegio No Asignado"}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Avatar className="h-16 w-16 border">
                                <AvatarImage src={hijo.avatar_url || ''} data-ai-hint="child face" />
                                <AvatarFallback className="text-xl">
                                    {(hijo.nombre?.[0] || '')}{(hijo.apellido?.[0] || '')}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                onClick={handleAvatarClick}
                                disabled={isUploading}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-6 w-6 text-white" />
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
                        <h2 className="text-xl font-bold">{hijo.nombre} {hijo.apellido}</h2>
                    </div>
                    
                    <Separator />

                    <div className="p-1 space-y-4">
                        <h3 className="font-semibold text-foreground">Paradas Principales</h3>
                        <AddressRow icon={Home} type="Recogida (Casa)" stop={paradaRecogida} />
                        <AddressRow icon={MapPin} type="Entrega (Casa)" stop={paradaEntrega} />
                    </div>
                    
                    <Button asChild className="w-full" variant="outline">
                        <Link href={`/mipanel/hijos/${hijo.id}/direcciones`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Gestionar Direcciones
                        </Link>
                    </Button>

                </CardContent>
            </Card>
            {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCroppedImage}
                    onClose={() => setImageToCrop(null)}
                />
            )}
        </>
    )
}
