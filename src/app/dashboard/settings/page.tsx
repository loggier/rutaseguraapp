
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
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

// The component now accepts `user` as a prop from the layout.
export default function SettingsPage({ user }: { user: User | null }) {
  const supabase = createClient();
  const { toast } = useToast();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // The email is taken directly from the `user` prop and should always be available.
  const email = user?.email || '';

  useEffect(() => {
    // This useEffect is now only responsible for loading the *profile* data
    // as the *user* data is passed in via props.
    const fetchUserProfile = async () => {
      if (!user) {
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not a fatal error
        console.error("Error fetching profile:", error);
        toast({
          variant: "destructive",
          title: "Error al cargar el perfil",
          description: "No se pudo recuperar la información del perfil.",
        });
      } else if (profileData) {
        setFirstName(profileData.nombre || '');
        setLastName(profileData.apellido || '');
      }
      setIsLoadingProfile(false);
    };

    fetchUserProfile();
  }, [user, supabase, toast]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    
    const { error } = await supabase.from('profiles').update({
      nombre: firstName,
      apellido: lastName,
      // Ensure the 'updated_at' field is handled by Supabase policies if needed
    }).eq('id', user.id);

    if (error) {
        toast({
            variant: "destructive",
            title: "Error al actualizar",
            description: error.message,
        });
    } else {
        toast({
            title: "Perfil actualizado",
            description: "Tu información ha sido guardada correctamente.",
        });
    }

    setIsSaving(false);
  }

  // The main loading state from the layout handles the initial user loading.
  // This component's loading state is only for the profile-specific fields.
  const isFormDisabled = isSaving || isLoadingProfile;

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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre</Label>
                                {isLoadingProfile ? <Loader2 className="h-4 w-4 animate-spin"/> : <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isSaving} />}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido</Label>
                                {isLoadingProfile ? <Loader2 className="h-4 w-4 animate-spin"/> : <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isSaving}/>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" type="email" value={email} disabled />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isFormDisabled}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Seguridad</CardTitle>
                    <CardDescription>Gestiona tu contraseña.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Contraseña Actual</Label>
                        <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <Input id="newPassword" type="password" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button>Actualizar Contraseña</Button>
                </CardFooter>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Notificaciones</CardTitle>
                    <CardDescription>Elige cómo quieres ser notificado.</CardDescription>
                </Header>
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
