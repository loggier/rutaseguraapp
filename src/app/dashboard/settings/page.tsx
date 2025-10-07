
'use client';

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/user-context";

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const email = user?.email || '';

  useEffect(() => {
    if (user) {
      setFirstName(user.nombre || '');
      setLastName(user.apellido || '');
      setIsLoadingProfile(false);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    // TODO: Implement custom profile update logic
    toast({
        title: "Perfil actualizado (Simulado)",
        description: "Tu información ha sido guardada correctamente.",
    });
    setIsSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Por favor, completa los campos de contraseña.",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Las contraseñas no coinciden",
        description: "Por favor, verifica la nueva contraseña.",
      });
      return;
    }

    if (newPassword.length < 6) {
        toast({
            variant: "destructive",
            title: "Contraseña insegura",
            description: "La nueva contraseña debe tener al menos 6 caracteres.",
        });
        return;
    }

    setIsUpdatingPassword(true);
    // TODO: Implement custom password update logic
    toast({
        title: "Contraseña actualizada (Simulado)",
        description: "Tu contraseña ha sido cambiada con éxito.",
    });
    setNewPassword('');
    setConfirmPassword('');
    setIsUpdatingPassword(false);
  };
  
  if (!user && isLoadingProfile) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando usuario...</p>
      </div>
    );
  }

  const isFormDisabled = isSaving || isLoadingProfile;
  const isPasswordFormDisabled = isUpdatingPassword;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuración de la Cuenta"
        description="Administra la información de tu perfil, seguridad y notificaciones."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
            <form onSubmit={handleUpdateProfile}>
                <Card>
                    <CardHeader>
                        <CardTitle>Perfil</CardTitle>
                        <CardDescription>Esta es la información que se mostrará públicamente.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingProfile ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <p className="ml-4 text-muted-foreground">Cargando perfil...</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Nombre</Label>
                                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isSaving} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Apellido</Label>
                                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isSaving}/>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo Electrónico</Label>
                                    <Input id="email" type="email" value={email} disabled />
                                </div>
                            </>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isFormDisabled}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            <form onSubmit={handleUpdatePassword}>
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Seguridad</CardTitle>
                        <CardDescription>Gestiona tu contraseña.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Nueva Contraseña</Label>
                            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isPasswordFormDisabled} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isPasswordFormDisabled} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isPasswordFormDisabled}>
                            {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Actualizar Contraseña
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
        <div>
            <Card>
                <CardHeader> 
                    <CardTitle>Notificaciones</CardTitle>
                    <CardDescription>Elige cómo quieres ser notificado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="email-notifications" defaultChecked />
                        <label
                        htmlFor="email-notifications"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        Notificaciones por correo
                        </label>
                    </div>
                    <p className="text-sm text-muted-foreground">Recibe correos sobre actividad en tu cuenta.</p>
                    <Separator/>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="push-notifications" />
                        <label
                        htmlFor="push-notifications"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        Notificaciones Push
                        </label>
                    </div>
                    <p className="text-sm text-muted-foreground">Recibe notificaciones en tu dispositivo móvil.</p>
                </CardContent>
                <CardFooter>
                    <Button>Guardar Preferencias</Button>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  );
}
