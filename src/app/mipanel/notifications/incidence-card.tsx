'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Video, ImageIcon, FileText, CircleHelp, History, CheckCircle, XCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { IncidenceWithStudent } from "../actions";

const statusConfig = {
  nuevo: { label: 'Nuevo', color: 'bg-blue-500', icon: History },
  abierto: { label: 'Abierto', color: 'bg-yellow-500', icon: CircleHelp },
  en_proceso: { label: 'En Proceso', color: 'bg-purple-500', icon: History },
  resuelto: { label: 'Resuelto', color: 'bg-green-500', icon: CheckCircle },
  no_resuelto: { label: 'No Resuelto', color: 'bg-red-600', icon: XCircle },
  cerrado: { label: 'Cerrado', color: 'bg-gray-500', icon: CheckCircle },
};

const typeConfig = {
  video: { label: 'Solicitud de Video', icon: Video },
  imagen: { label: 'Solicitud de Imagen', icon: ImageIcon },
  general: { label: 'Reporte General', icon: FileText },
};

type IncidenceCardProps = {
  incidence: IncidenceWithStudent;
  onClick: () => void;
};

export function IncidenceCard({ incidence, onClick }: IncidenceCardProps) {
  const currentStatus = statusConfig[incidence.status] || statusConfig.nuevo;
  const currentType = typeConfig[incidence.tipo_solicitud] || typeConfig.general;

  const studentName = incidence.estudiante_id 
    ? `${incidence.estudiante_id.nombre} ${incidence.estudiante_id.apellido}` 
    : 'Estudiante no disponible';
  
  const formattedDate = format(new Date(incidence.fecha_incidente), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
  const timeAgo = formatDistanceToNow(new Date(incidence.created_at), { addSuffix: true, locale: es });

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 flex items-start gap-4">
        <div className={cn("flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full text-white", currentStatus.color)}>
          <currentStatus.icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-md truncate pr-2">{currentType.label}</h3>
            <Badge variant="secondary" className={cn("text-xs font-semibold text-white", currentStatus.color)}>{currentStatus.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Para: <span className="font-semibold text-foreground">{studentName}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Incidente: {formattedDate}
          </p>
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap pt-1">
          {timeAgo}
        </div>
      </CardContent>
    </Card>
  );
}
