'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users, User, Bus, Map, Rocket, LayoutDashboard, Route as RouteIcon,
  Menu, Bell, LogOut, Loader2, Shield, School, Contact,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { UserProvider, useUser as useAppUser, type User as AppUser } from '@/contexts/user-context';


// --- Constantes de Navegación ---
const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', allowedRoles: ['master', 'manager', 'colegio'] },
  { href: '/dashboard/users', icon: Shield, label: 'Usuarios', allowedRoles: ['master', 'manager'] },
  { href: '/dashboard/schools', icon: School, label: 'Colegios', allowedRoles: ['master', 'manager'] },
  { href: '/dashboard/parents', icon: Contact, label: 'Padres/Tutores', allowedRoles: ['master', 'manager', 'colegio'] },
  { href: '/dashboard/students', icon: Users, label: 'Estudiantes', allowedRoles: ['master', 'manager', 'colegio'] },
  { href: '/dashboard/drivers', icon: User, label: 'Conductores', allowedRoles: ['master', 'manager', 'colegio'] },
  { href: '/dashboard/buses', icon: Bus, label: 'Autobuses', allowedRoles: ['master', 'manager', 'colegio'] },
  { href: '/dashboard/routes', icon: RouteIcon, label: 'Rutas', allowedRoles: ['master', 'manager', 'colegio'] },
  { href: '/dashboard/tracking', icon: Map, label: 'Seguimiento', allowedRoles: ['master', 'manager', 'colegio'] },
  { href: '/dashboard/optimize-route', icon: Rocket, label: 'Optimizar Ruta', allowedRoles: ['master', 'manager'] },
];

// --- Componentes de Navegación (sin cambios) ---
function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { user } = useAppUser();

  const userRole = user?.rol;

  return (
    <SidebarMenu>
      {navItems
        .filter(item => userRole && item.allowedRoles.includes(userRole))
        .map((item) => (
         <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href) && (item.href === '/dashboard' ? pathname === item.href : true)}
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
  const { user } = useAppUser();
  const userRole = user?.rol;

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
          {navItems
            .filter(item => userRole && item.allowedRoles.includes(userRole))
            .map((item) => (
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

// --- Layout Content ---
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); 
  const pathname = usePathname();

  useEffect(() => {
    const sessionUserString = sessionStorage.getItem('rutasegura_user');
    if (sessionUserString) {
      setUser(JSON.parse(sessionUserString));
    }
    setIsLoading(false);
  }, [pathname]);
  
  const handleLogout = async () => {
    sessionStorage.removeItem('rutasegura_user');
    // Eliminar la cookie para que el middleware detecte la sesión cerrada
    document.cookie = 'rutasegura_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.replace('/');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario después de cargar, el middleware se encargará de la redirección.
  // Mostramos un loader para una mejor experiencia de usuario mientras ocurre.
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verificando sesión...</p>
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
                          <AvatarImage src={user?.avatar_url || "https://picsum.photos/seed/user-avatar-1/64/64"} data-ai-hint="person face" />
                          <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                      </Avatar>
                      <span className="sr-only">Menú de usuario</span>
                  </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user?.nombre ? `${user.nombre} ${user.apellido}`: (user?.email || 'Cargando...')}</DropdownMenuLabel>
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
    </UserProvider>
  );
}


// --- Dashboard Layout Principal ---
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}
