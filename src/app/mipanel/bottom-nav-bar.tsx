'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems, useNotifications } from './layout';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function BottomNavBar() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 h-20 bg-primary text-primary-foreground shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:hidden">
      <nav className="grid h-full grid-cols-5 items-center">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const itemIsBell = item.label === 'Alertas';
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-full flex-col items-center justify-center gap-1 text-center"
            >
              <div className="relative">
                <item.icon
                  className={cn(
                    'h-6 w-6 transition-all',
                    isActive ? 'text-white' : 'text-primary-foreground/70'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                 {itemIsBell && unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-2 h-4 w-4 shrink-0 rounded-full p-0 flex items-center justify-center text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-all',
                  isActive ? 'text-white' : 'text-primary-foreground/70'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
