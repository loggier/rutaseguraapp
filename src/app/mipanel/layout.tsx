'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Map, Users, Settings, Bell, LogOut, Loader2, Home,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProvider, type User as AppUser } from '@/contexts/user-context';
import { BottomNavBar } from './bottom-nav-bar';
import { useIsMobile } from '@/hooks/use-mobile';
import { MiPanelSidebar } from './sidebar';

export const navItems = [
  { href: '/mipanel', icon: Map, label: 'Mapa' },
  { href: '/mipanel/hijos', icon: Users, label: 'Mis Hijos' },
  { href: '/mipanel/home-placeholder', icon: Home, label: 'Inicio' }, // Placeholder
  { href: '/mipanel/notifications', icon: Bell, label: 'Alertas' }, // Placeholder
  { href: '/mipanel/settings', icon: Settings, label: 'Ajustes' },
];

function MiPanelLayoutContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); 
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const sessionUserString = localStorage.getItem('supabase_session');
    if (sessionUserString) {
      try {
        const sessionUser = JSON.parse(sessionUserString);
        if (sessionUser.rol !== 'padre') {
            router.replace('/'); // Not a parent, redirect to login
            return;
        }
        setUser(sessionUser);
      } catch (e) {
        console.error("Fallo al parsear la sesión de usuario, cerrando sesión.", e);
        localStorage.removeItem('supabase_session');
        router.replace('/'); 
      }
    } else {
        router.replace('/');
    }
    setIsLoading(false);
  }, [router]);
  
  const handleLogout = () => {
    localStorage.removeItem('supabase_session');
    router.replace('/');
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  const getAvatarFallback = () => {
    if (!user) return "AD";
    const name = user.nombre;
    if (name && typeof name === 'string' && user.apellido) {
      return (user.nombre[0] + user.apellido[0]).toUpperCase();
    }
    return (user.email || '').substring(0, 2).toUpperCase();
  }

  return (
    <UserProvider user={user}>
       <div className="min-h-screen w-full bg-background text-foreground md:grid md:grid-cols-[220px_1fr]">
        <MiPanelSidebar />
        <div className="flex flex-col">
            <header className="absolute top-0 right-0 z-20 flex h-16 items-center justify-end gap-4 bg-transparent px-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className='h-9 w-9 border-2 border-background shadow-md'>
                            <AvatarImage src={user?.avatar_url || "https://picsum.photos/seed/user-avatar-1/64/64"} data-ai-hint="person face" />
                            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Menú de usuario</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user?.nombre ? `${user.nombre} ${user.apellido}`: (user?.email || 'Cargando...')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/mipanel/hijos">Mis Hijos</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/mipanel/settings">Configuración</Link></DropdownMenuItem>
                    <DropdownMenuItem>Soporte</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <main className="h-screen w-full md:h-full">
              {children}
            </main>
            {isMobile && <BottomNavBar />}
        </div>
       </div>
    </UserProvider>
  );
}

export default function MiPanelLayout({ children }: { children: React.ReactNode }) {
  return <MiPanelLayoutContent>{children}</MiPanelLayoutContent>;
}
