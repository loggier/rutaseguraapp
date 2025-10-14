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
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import type { Colegio } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function LoginPage() {
  const [userType, setUserType] = useState<'parent' | 'staff'>('staff');
  const [colegioId, setColegioId] = useState<string>('');
  const [email, setEmail] = useState('master@rutasegura.com');
  const [password, setPassword] = useState('Martes13');
  const [isPending, setIsPending] = useState(false);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchColegios() {
      const supabase = createClient();
      const { data, error } = await supabase.from('colegios').select('id, nombre').eq('activo', true).order('nombre');
      if (error) {
        console.error("Error fetching colegios", error);
        toast({
            variant: "destructive",
            title: "Error de Carga",
            description: "No se pudieron cargar los colegios.",
        });
      } else {
        setColegios(data || []);
      }
    }
    fetchColegios();
  }, [toast]);


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const finalColegioId = userType === 'parent' ? colegioId : (colegios[0]?.id || '');

    if (userType === 'parent' && !finalColegioId) {
        toast({
            variant: "destructive",
            title: "Campo Requerido",
            description: "Por favor, selecciona un colegio.",
        });
        return;
    }

    setIsPending(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, colegioId: finalColegioId }),
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
        router.push('/dashboard');
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
              Selecciona tu rol e inicia sesión para acceder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="grid gap-4">
               <div className="grid gap-2">
                <Label>Tipo de Usuario</Label>
                <RadioGroup defaultValue="staff" onValueChange={(value: 'parent' | 'staff') => setUserType(value)} className="grid grid-cols-2 gap-4">
                    <div>
                        <RadioGroupItem value="staff" id="staff" className="peer sr-only" />
                        <Label htmlFor="staff" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Personal/Admin
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="parent" id="parent" className="peer sr-only" />
                        <Label htmlFor="parent" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Padre/Tutor
                        </Label>
                    </div>
                </RadioGroup>
              </div>

              {userType === 'parent' && (
                <div className="grid gap-2">
                    <Label htmlFor="colegio">Colegio</Label>
                    <Select onValueChange={setColegioId} value={colegioId}>
                        <SelectTrigger id="colegio">
                            <SelectValue placeholder="Selecciona tu colegio" />
                        </SelectTrigger>
                        <SelectContent>
                            {colegios.map(colegio => (
                                <SelectItem key={colegio.id} value={colegio.id}>
                                    {colegio.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              )}

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
              <Button type="submit" className="w-full" disabled={isPending || (userType === 'parent' && colegios.length === 0)}>
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
