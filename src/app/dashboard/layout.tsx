'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  User,
  Bus,
  Map,
  Rocket,
  LayoutDashboard,
  CreditCard,
  Route as RouteIcon,
  Menu,
  Bell,
  LogOut,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/students', icon: Users, label: 'Estudiantes' },
  { href: '/dashboard/drivers', icon: User, label: 'Conductores' },
  { href: '/dashboard/buses', icon: Bus, label: 'Autobuses' },
  { href: '/dashboard/routes', icon: RouteIcon, label: 'Rutas' },
  { href: '/dashboard/tracking', icon: Map, label: 'Seguimiento' },
  { href: '/dashboard/optimize-route', icon: Rocket, label: 'Optimizar Ruta' },
];

function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
         <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={open ? undefined : item.label}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menú de navegación</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-2 text-lg font-medium">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-4">
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
        <div className="mt-auto">
            <Card>
              <CardHeader>
                <CardTitle>Nuevas Funciones</CardTitle>
                <CardDescription>
                  Descubre las últimas mejoras en nuestra plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm" className="w-full">
                  Ver Novedades
                </Button>
              </CardContent>
            </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createClient();
  
  useEffect(() => {
    const initializeSession = () => {
      const sessionDataString = localStorage.getItem('supabase_session');
      console.log('Session data from localStorage:', sessionDataString);

      if (sessionDataString) {
        try {
          const session = JSON.parse(sessionDataString);
          if (session && session.user) {
            setUser(session.user);
            // Opcional: sincronizar el cliente de Supabase con esta sesión
            supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            });
          }
        } catch (error) {
          console.error("Error parsing session data from localStorage", error);
          setUser(null);
        }
      }
    };

    initializeSession();
    
    // También escuchamos cambios por si la sesión se actualiza en otra pestaña
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event, 'Session:', session);
        const currentUser = session?.user ?? null;
        // Solo actualiza si el usuario ha cambiado para evitar bucles de renderizado
        if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
            setUser(currentUser);
        }
    });

    return () => {
        authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('supabase_session');
    window.location.href = '/';
  };

  const getAvatarFallback = () => {
    if (!user) return "AD";
    const email = user.email || '';
    const name = user.user_metadata?.name;
    if (name) {
      return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
        <Sidebar collapsible="icon" className="hidden md:flex flex-col bg-card border-r">
            <SidebarHeader className='p-4'>
                <Link href="/dashboard">
                  <Image src="/logo-main.jpeg" alt="RutaSegura" width={130} height={30} style={{height: "auto"}} className='group-data-[collapsible=icon]:hidden' />
                </Link>
            </SidebarHeader>
            <SidebarContent className="flex-1 p-2">
                <SidebarNav />
            </SidebarContent>
            <SidebarFooter className="p-4">
                <Card className='group-data-[collapsible=icon]:hidden'>
                    <CardHeader className="p-2 pt-0 md:p-4">
                        <CardTitle>Nuevas Funciones</CardTitle>
                        <CardDescription>
                        Descubre las últimas mejoras en nuestra plataforma.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                        <Button size="sm" className="w-full">
                        Ver Novedades
                        </Button>
                    </CardContent>
                </Card>
            </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
            <MobileNav />
            <SidebarTrigger className="hidden md:flex" />
            
            <div className="w-full flex-1">
                {/* Can add a global search here if needed */}
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notificaciones</span>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className='h-8 w-8'>
                        <AvatarImage src={user?.user_metadata.avatar_url || "https://picsum.photos/seed/user-avatar-1/64/64"} data-ai-hint="person face" />
                        <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Menú de usuario</span>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.user_metadata.name || user?.email || 'Cargando...'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/dashboard/settings">Configuración</Link></DropdownMenuItem>
                <DropdownMenuItem>Soporte</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
            {children}
            </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
