'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
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
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AuthApiError } from '@supabase/supabase-js';

export default function LoginPage() {
  const [email, setEmail] = useState('master@rutasegura.com');
  const [password, setPassword] = useState('Martes13');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  
  const supabase = createClient();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      if (loginError instanceof AuthApiError && loginError.message === 'Invalid login credentials') {
        console.log('Usuario no encontrado, intentando registrar...');
        toast({
          title: "Configurando cuenta de administrador",
          description: "El usuario maestro no existe, se creará automáticamente.",
        });
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        // Si hay un error de registro, pero NO es sobre el envío del correo, es un problema.
        if (signUpError && !signUpError.message.includes('Error sending confirmation email')) {
          console.error('Error durante el registro del usuario master:', signUpError);
          toast({
            variant: "destructive",
            title: "Error al registrar usuario master",
            description: `No se pudo crear la cuenta. Detalle: ${signUpError.message}`,
          });
        } else {
          // Si el registro fue exitoso (o solo falló el email), iniciamos sesión para obtener la sesión activa
          console.log('Usuario master creado (o ya existía). Iniciando sesión...');
           const { data: finalLoginData, error: finalLoginError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (finalLoginError) {
                 toast({
                    variant: "destructive",
                    title: "Error final de login",
                    description: `No se pudo iniciar sesión tras el registro: ${finalLoginError.message}`,
                });
            } else {
                 toast({
                    title: "¡Cuenta de administrador lista!",
                    description: "¡Bienvenido a RutaSegura! Redirigiendo al dashboard...",
                  });
                  router.push('/dashboard');
            }
        }
      } else {
        console.error('Error de inicio de sesión:', loginError);
        toast({
          variant: "destructive",
          title: "Error al iniciar sesión",
          description: `Ha ocurrido un error. Detalle: ${loginError.message}. Revisa las credenciales y la conexión.`,
        });
      }
    } else {
      console.log('Inicio de sesión exitoso:', loginData);
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo a RutaSegura.",
      });
      router.push('/dashboard');
    }
    
    setIsPending(false);
  };

  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <Card className="mx-auto max-w-sm w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Image src="/logo.jpeg" alt="RutaSegura Logo" width={120} height={120} />
            </div>
            <CardTitle className="text-2xl text-center font-headline">
              Bienvenido a RutaSegura
            </CardTitle>
            <CardDescription className="text-center">
              Inicia sesión para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
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
