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

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuración de la Cuenta"
        description="Administra la información de tu perfil, seguridad y notificaciones."
      />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>Esta es la información que se mostrará públicamente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Nombre</Label>
                            <Input id="firstName" defaultValue="Admin" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input id="lastName" defaultValue="RutaSegura" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" defaultValue="admin@rutasegura.com" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button>Guardar Cambios</Button>
                </CardFooter>
            </Card>

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
