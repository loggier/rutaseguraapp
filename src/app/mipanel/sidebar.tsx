'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems, useParentDashboard, useNotifications } from './layout';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HijoCard } from './hijo-card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';


export function MiPanelSidebar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { hijos, buses, activeChildId, setActiveChildId } = useParentDashboard();
  const { unreadCount } = useNotifications();

  if (isMobile) {
    return null;
  }

  return (
    <div className="hidden md:flex flex-col gap-2 border-r bg-card text-card-foreground p-4">
      <div className="flex h-16 items-center">
        <Link href="/mipanel" className="flex items-center gap-2 font-semibold">
          <Image src="/logo-main.jpeg" alt="RutaSegura" width={140} height={40} style={{height: "auto"}} />
        </Link>
      </div>
      <nav className="grid items-start gap-2 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const itemIsBell = item.label === 'Alertas';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                isActive && 'bg-muted text-primary'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {itemIsBell && unreadCount > 0 && (
                <Badge variant="destructive" className="absolute right-3 top-1/2 -translate-y-1/2 h-5 min-w-[1.25rem] p-1 flex items-center justify-center text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        <h3 className="px-3 text-xs font-semibold text-muted-foreground">Mis Hijos</h3>
        <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className='space-y-2 pr-3'>
              {hijos.map((hijo) => (
                 <HijoCard 
                    key={hijo.id} 
                    hijo={hijo} 
                    bus={buses.find(b => b.ruta?.id === (hijo as any).ruta_id)}
                    isActive={activeChildId === hijo.id}
                    onClick={() => setActiveChildId(hijo.id)}
                 />
              ))}
            </div>
        </ScrollArea>
      </div>
    </div>
  );
}
