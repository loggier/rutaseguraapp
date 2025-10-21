'use client';

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
  variant?: 'default' | 'destructive';
}

export function NotificationCard({ icon, title, description, timestamp, variant = 'default' }: NotificationCardProps) {
  return (
    <Card className={cn("overflow-hidden", variant === 'destructive' && 'bg-destructive/10 border-destructive')}>
      <CardContent className="p-4 flex items-start gap-4 relative">
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1.5",
          variant === 'destructive' ? 'bg-destructive' : 'bg-primary'
        )}></div>
        <div className={cn(
            "flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full ml-1.5",
            variant === 'destructive' ? 'bg-destructive/20 text-destructive' : 'bg-primary/10 text-primary'
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-md">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {timestamp}
        </div>
      </CardContent>
    </Card>
  );
}
