
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from './layout';
import { cn } from '@/lib/utils';

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 h-20 bg-primary text-primary-foreground shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:hidden">
      <nav className="grid h-full grid-cols-5 items-center">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex h-full flex-col items-center justify-center gap-1 text-center"
            >
              <item.icon
                className={cn(
                  'h-6 w-6 transition-all',
                  isActive ? 'text-white' : 'text-primary-foreground/70'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
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
