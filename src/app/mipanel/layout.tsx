'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState, useCallback, useContext, createContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLoadScript } from '@react-google-maps/api';
import {
  Map, Users, Settings, Bell, LogOut, Loader2, Video
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
import type { Estudiante, Parada, TrackedBus, Colegio, Autobus } from '@/lib/types';
import { getParentDashboardData } from './actions';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export const navItems = [
  { href: '/mipanel', icon: Map, label: 'Mapa' },
  { href: '/mipanel/camaras', icon: Video, label: 'Cámaras' },
  { href: '/mipanel/hijos', icon: Users, label: 'Mis Hijos' },
  { href: '/mipanel/notifications', icon: Bell, label: 'Alertas' },
  { href: '/mipanel/settings', icon: Settings, label: 'Ajustes' },
];

type MappedBus = TrackedBus & {
  estudiantes_ids: string[];
};

export type ParentDashboardContextType = {
  hijos: (Estudiante & { paradas: Parada[], ruta_id?: string })[];
  buses: MappedBus[];
  colegio: Colegio | null;
  loading: boolean;
  refreshData: () => void;
  activeChildId: string | null;
  setActiveChildId: React.Dispatch<React.SetStateAction<string | null>>;
};

const ParentDashboardContext = React.createContext<ParentDashboardContextType | null>(null);

export const useParentDashboard = () => {
    const context = React.useContext(ParentDashboardContext);
    if (!context) {
        throw new Error("useParentDashboard must be used within a ParentDashboardProvider");
    }
    return context;
};

const libraries: ('geometry' | 'places')[] = ['geometry', 'places'];
type GoogleMapsContextType = {
  isLoaded: boolean;
  loadError?: Error;
};

const GoogleMapsContext = createContext<GoogleMapsContextType | null>(null);

export const useGoogleMaps = () => {
    const context = useContext(GoogleMapsContext);
    if (!context) {
        throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
    }
    return context;
};


function MiPanelLayoutContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [dashboardData, setDashboardData] = useState<Omit<ParentDashboardContextType, 'loading' | 'refreshData' | 'activeChildId' | 'setActiveChildId'>>({ hijos: [], buses: [], colegio: null });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);


  const router = useRouter(); 
  const pathname = usePathname();
  const isMobile = useIsMobile();
  
  const { isLoaded, loadError } = useLoadScript({
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      libraries,
  });
  
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
    setIsLoadingUser(false);
  }, [router]);
  
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingData(true);
    const data = await getParentDashboardData(user.id);
    
    const childrenWithParadas = data.hijos.map(h => ({...h, paradas: h.paradas || []}));
    
    const mappedBuses = data.buses.map(bus => {
        return {
            ...bus,
            estudiantes_ids: data.hijos.filter(h => h.ruta_id === bus.ruta?.id).map(h => h.id)
        };
    });

    setDashboardData({ hijos: childrenWithParadas, buses: mappedBuses, colegio: data.colegio });
    if (childrenWithParadas.length > 0 && !activeChildId) {
        setActiveChildId(childrenWithParadas[0].id);
    }
    setIsLoadingData(false);
  }, [user, activeChildId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription for bus locations
  useEffect(() => {
    if (!dashboardData.colegio?.id) {
        return;
    }

    const supabase = createClient();
    const channel = supabase.channel('autobuses-location-changes')
        .on(
            'postgres_changes',
            { 
                event: 'UPDATE', 
                schema: 'rutasegura', 
                table: 'autobuses',
                filter: `colegio_id=eq.${dashboardData.colegio.id}`
            },
            (payload) => {
                const updatedBusData = payload.new as Autobus;
                
                setDashboardData(currentData => {
                    const busIndex = currentData.buses.findIndex(b => b.id === updatedBusData.id);

                    if (busIndex === -1) {
                        return currentData; // Not a bus this user is tracking
                    }

                    const newBuses = [...currentData.buses];
                    const busToUpdate = { ...newBuses[busIndex] };

                    // Update location from realtime payload
                    busToUpdate.last_valid_latitude = updatedBusData.last_valid_latitude;
                    busToUpdate.last_valid_longitude = updatedBusData.last_valid_longitude;

                    newBuses[busIndex] = busToUpdate;
                    
                    return { ...currentData, buses: newBuses };
                });
            }
        )
        .subscribe();

    // Cleanup subscription on component unmount
    return () => {
        supabase.removeChannel(channel);
    };
}, [dashboardData.colegio?.id]);


  const handleLogout = () => {
    localStorage.removeItem('supabase_session');
    setUser(null);
    router.replace('/');
  };

  if (isLoadingUser || !user) {
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
  
  const isMapPage = pathname === '/mipanel';

  return (
    <UserProvider user={user} setUser={setUser}>
      <ParentDashboardContext.Provider value={{ ...dashboardData, loading: isLoadingData, refreshData: fetchData, activeChildId, setActiveChildId }}>
        <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
          <div className="min-h-screen w-full bg-background text-foreground md:grid md:grid-cols-[280px_1fr]">
            <MiPanelSidebar />
            <div className="flex flex-col h-screen">
                {isMapPage && (
                    <header className="absolute top-0 right-0 z-20 flex h-16 items-center justify-end gap-4 bg-transparent px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Avatar className='h-9 w-9 border-2 border-background shadow-md'>
                                    <AvatarImage src={user?.avatar_url || ""} data-ai-hint="person face" />
                                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                                </Avatar>
                                <span className="sr-only">Menú de usuario</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{user?.nombre ? `${user.nombre} ${user.apellido}`: (user?.email || 'Cargando...')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild><Link href="/mipanel/hijos">Mis Hijos</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href="/mipanel/settings">Ajustes</Link></DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </header>
                )}
                <main className={cn("flex-1 h-full overflow-hidden", {
                    'pb-20 md:pb-0': !isMapPage
                })}>
                  {children}
                </main>
                {isMobile && <BottomNavBar />}
            </div>
          </div>
        </GoogleMapsContext.Provider>
      </ParentDashboardContext.Provider>
    </UserProvider>
  );
}

export default function MiPanelLayout({ children }: { children: React.ReactNode }) {
  return <MiPanelLayoutContent>{children}</MiPanelLayoutContent>;
}
