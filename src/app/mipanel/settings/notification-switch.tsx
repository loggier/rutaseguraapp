'use client';

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type NotificationSwitchProps = {
  id: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
  className?: string;
};

export function NotificationSwitch({
  id,
  label,
  description,
  defaultChecked,
  className,
}: NotificationSwitchProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50",
        className
      )}
    >
      <div className="space-y-1">
        <Label htmlFor={id} className="font-semibold cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} defaultChecked={defaultChecked} />
    </div>
  );
}
