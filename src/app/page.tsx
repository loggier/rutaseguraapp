
'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsAppInstalled(true);
    }

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPromptEvent(null);
      toast({
          title: 'Aplicación Instalada',
          description: 'RutaSegura se ha instalado correctamente.',
      });
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);
  
  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      return;
    }
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      console.log('El usuario aceptó la instalación');
      setIsAppInstalled(true);
    } else {
      console.log('El usuario rechazó la instalación');
    }
    setInstallPromptEvent(null);
  };


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ocurrió un error al iniciar sesión.');
      }
      
      const userDataString = JSON.stringify(data.user);
      localStorage.setItem('supabase_session', userDataString);

      toast({
        title: "Inicio de Sesión Exitoso",
        description: "Redirigiendo...",
      });
      
      if (data.user.rol === 'padre') {
        router.push('/mipanel');
      } else {
        toast({
            variant: 'destructive',
            title: 'Acceso Denegado',
            description: 'Esta aplicación es solo para padres/tutores.'
        });
        localStorage.removeItem('supabase_session');
        setIsPending(false);
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de Autenticación",
        description: error.message,
      });
       setIsPending(false);
    }
  };
  
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 lg:p-12">
        <Card className="mx-auto max-w-sm w-full lg:border lg:shadow-sm border-none shadow-none">
          <CardHeader className="px-0 lg:px-6">
            <div className="flex justify-center mb-4">
              <Image src="/logo.jpeg" alt="RutaSegura Logo" width={120} height={120} />
            </div>
            <CardTitle className="text-2xl text-center font-headline">
              Bienvenido a RutaSegura
            </CardTitle>
            <CardDescription className="text-center">
              Inicia sesión para acceder a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 lg:px-6">
            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
              {installPromptEvent && !isAppInstalled && (
                <Button
                  variant="outline"
                  onClick={handleInstallClick}
                  className="w-full mt-2"
                  disabled={isPending}
                  type="button"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Instalar Aplicación
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
       <div className="hidden bg-muted lg:block">
        <Image
          src="https://picsum.photos/seed/school-bus/1920/1080"
          alt="Image"
          width="1920"
          height="1080"
          data-ai-hint="school bus"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
