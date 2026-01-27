
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Video, ImageIcon, FileText, CircleHelp, History, CheckCircle, XCircle, User, Calendar, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IncidenceWithStudent } from '../actions';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusConfig = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-500 text-blue-50', icon: History },
  abierto: { label: 'Abierto', color: 'bg-yellow-500 text-yellow-50', icon: CircleHelp },
  en_proceso: { label: 'En Proceso', color: 'bg-purple-500 text-purple-50', icon: History },
  resuelto: { label: 'Resuelto', color: 'bg-green-500 text-green-50', icon: CheckCircle },
  no_resuelto: { label: 'No Resuelto', color: 'bg-red-600 text-red-50', icon: XCircle },
  cerrado: { label: 'Cerrado', color: 'bg-gray-500 text-gray-50', icon: CheckCircle },
};

const typeConfig = {
  video: { label: 'Solicitud de Video', icon: Video },
  imagen: { label: 'Solicitud de Imagen', icon: ImageIcon },
  general: { label: 'Reporte General', icon: FileText },
};

type IncidenceDetailModalProps = {
  incidence: IncidenceWithStudent;
  isOpen: boolean;
  onClose: () => void;
};

const DetailRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground">{label}</p>
            <p className="text-md text-foreground">{value}</p>
        </div>
    </div>
);


export function IncidenceDetailModal({ incidence, isOpen, onClose }: IncidenceDetailModalProps) {
  const currentStatus = statusConfig[incidence.status] || statusConfig.nuevo;
  const currentType = typeConfig[incidence.tipo_solicitud] || typeConfig.general;

  const studentName = incidence.estudiante 
    ? `${incidence.estudiante.nombre} ${incidence.estudiante.apellido}` 
    : 'Estudiante no disponible';
  
  const formattedIncidenceDate = format(new Date(incidence.fecha_incidente), "d 'de' MMMM, yyyy", { locale: es });
  const formattedIncidenceTime = format(new Date(incidence.fecha_incidente), "HH:mm 'hrs'", { locale: es });
  const formattedCreationDate = format(new Date(incidence.created_at!), "d MMM yyyy, HH:mm", { locale: es });
  const timeAgo = formatDistanceToNow(new Date(incidence.created_at!), { addSuffix: true, locale: es });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3'>
             <currentType.icon className="h-6 w-6 text-primary"/>
             {currentType.label}
          </DialogTitle>
          <DialogDescription>
            ID de Incidencia: {incidence.id.substring(0,8)}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-6 py-4 pr-2">
                <div className='flex justify-between items-center'>
                    <p className='text-sm text-muted-foreground'>Estado actual:</p>
                    <Badge className={cn("text-sm", currentStatus.color)}>
                        <currentStatus.icon className="h-4 w-4 mr-2" />
                        {currentStatus.label}
                    </Badge>
                </div>

                <Separator />

                <div className="space-y-4">
                    <DetailRow icon={User} label="Estudiante" value={studentName} />
                    <DetailRow icon={Calendar} label="Fecha del Incidente" value={formattedIncidenceDate} />
                    <DetailRow icon={Clock} label="Hora del Incidente" value={formattedIncidenceTime} />
                </div>
                
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Observación / Detalle del reporte:</p>
                    <div className="p-3 bg-muted/50 rounded-md border text-sm text-foreground max-h-40 overflow-y-auto">
                        <p>{(incidence as any).observacion || 'No se proporcionaron detalles.'}</p>
                    </div>
                </div>

                <Separator />

                 <div className="text-xs text-muted-foreground text-center">
                    <p>Reporte creado el {formattedCreationDate} ({timeAgo})</p>
                </div>

            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
