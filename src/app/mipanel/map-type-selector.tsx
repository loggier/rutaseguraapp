'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Layers, X } from "lucide-react";
import Image from 'next/image';
import { cn } from '@/lib/utils';

type MapTypeSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

const mapTypes = [
  { id: 'TRAFFIC', label: 'Auto', imageUrl: '/google_trafic.png', hint: 'map traffic' },
  { id: 'roadmap', label: 'Calle', imageUrl: '/google_normal.png', hint: 'map road' },
  { id: 'SATELLITE', label: 'Satélite', imageUrl: '/google_sat.png', hint: 'map satellite' },
];

export function MapTypeSelector({ value, onChange }: MapTypeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className='h-12 w-12 rounded-full bg-background shadow-lg'>
          <Layers className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[40vh]">
        <SheetHeader className="text-center mb-4">
          <SheetTitle>Tipo de mapa</SheetTitle>
        </SheetHeader>
        <div className="flex justify-around gap-4">
          {mapTypes.map((type) => (
            <div
              key={type.id}
              className="flex flex-col items-center gap-2 cursor-pointer"
              onClick={() => handleSelect(type.id)}
            >
              <div
                className={cn(
                  "relative h-24 w-24 rounded-lg overflow-hidden border-2 transition-all",
                  value === type.id ? "border-primary ring-2 ring-primary" : "border-transparent"
                )}
              >
                <Image
                  src={type.imageUrl}
                  alt={type.label}
                  width={96}
                  height={96}
                  className="object-cover h-full w-full"
                  data-ai-hint={type.hint}
                />
              </div>
              <span className={cn(
                "text-sm font-medium",
                value === type.id ? "text-primary" : "text-muted-foreground"
              )}>
                {type.label}
              </span>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
