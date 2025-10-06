
'use client';

import { useState, useEffect } from 'react';
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
import { useSession } from '@/contexts/SessionContext';

export default function LoginPage() {
  const [email, setEmail] = useState('master@rutasegura.com');
  const [password, setPassword] = useState('Martes13');
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const { login, isLoggedIn, loading } = useSession();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.push('/dashboard');
    }
  }, [loading, isLoggedIn, router]);
  
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
            variant: "destructive",
            title: "Error al iniciar sesión",
            description: error.message || "Ocurrió un error inesperado.",
        });
      } else if (data.session) {
        toast({
          title: "¡Login Correcto!",
          description: "Serás redirigido al dashboard.",
        });
        login(data.session); // Usamos la función login del contexto
      } else {
        toast({
          variant: "destructive",
          title: "Error inesperado",
          description: "No se recibió una sesión del servidor.",
        });
      }
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error de sistema",
            description: error.message || "Ocurrió un error durante el proceso de inicio de sesión.",
        });
    } finally {
        setIsPending(false);
    }
  };

  if (loading || isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Cargando sesión...</p>
      </div>
    );
  }

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
