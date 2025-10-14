'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Map, Users, Settings, Menu, Bell, LogOut, Loader2,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserProvider, useUser as useAppUser, type User as AppUser } from '@/contexts/user-context';


const navItems = [
  { href: '/mipanel', icon: Map, label: 'Mapa en Vivo' },
  { href: '/mipanel/hijos', icon: Users, label: 'Mis Hijos' },
  { href: '/mipanel/settings', icon: Settings, label: 'Configuración' },
];

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Menú de navegación</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-2 text-lg font-medium">
          <Link href="/mipanel" className="flex items-center gap-2 text-lg font-semibold mb-4">
             <Image src="/logo-main.jpeg" alt="RutaSegura" width={130} height={30} style={{height: "auto"}} />
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MiPanelLayoutContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); 
  
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
       <div className="min-h-screen w-full bg-background text-foreground">
        <header className="absolute top-0 left-0 right-0 z-20 flex h-16 items-center justify-between gap-4 bg-transparent px-4">
            <MobileNav />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className='h-9 w-9 border'>
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
        <main className="h-screen w-screen">
          {children}
        </main>
       </div>
    </UserProvider>
  );
}

export default function MiPanelLayout({ children }: { children: React.ReactNode }) {
  return <MiPanelLayoutContent>{children}</MiPanelLayoutContent>;
}
