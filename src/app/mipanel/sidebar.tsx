'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems } from './layout';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function MiPanelSidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden md:flex flex-col gap-2 border-r bg-card text-card-foreground p-4">
      <div className="flex h-16 items-center">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Image src="/logo-main.jpeg" alt="RutaSegura" width={140} height={40} style={{height: "auto"}} />
        </Link>
      </div>
      <nav className="grid items-start gap-2 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                isActive && 'bg-muted text-primary'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
