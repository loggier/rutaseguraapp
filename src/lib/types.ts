



export type User = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: "admin" | "tutor" | "estudiante" | "conductor";
  estado: "activo" | "suspendido" | "en_revision" | "sin_monedas";
  fecha_registro: string;
  avatarUrl: string;
};

export type NotificationSettings = {
    [key: string]: boolean;
};

export type Profile = {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email?: string; 
  avatar_url?: string | null;
  rol: "master" | "manager" | "colegio" | "padre";
  activo: boolean;
  colegio_id?: string | null; // ID del colegio al que pertenece el padre/tutor
  telefono?: string | null;
  direccion?: string | null;
  email_adicional?: string | null;
  notification_settings?: NotificationSettings | null;
};

export type Colegio = {
    id: string;
    usuario_id: string; // Foreign key to users.id
    nombre: string;
    ruc: string;
    email: string; // Email de la cuenta de usuario (desde la vista)
    email_contacto: string;
    telefono: string;
    direccion: string;
    lat: number | null;
    lng: number | null;
    calle: string | null;
    numero: string | null;
    activo: boolean;
    creado_por: string; // Foreign key to users.id
}

export type Estudiante = {
  id: string;
  nombre: string;
  apellido: string;
  student_id: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  avatar_url?: string | null;
  colegio_id: string;
  padre_id: string;
  creado_por: string;
  fecha_creacion: string;
  // Campos join
  padre_nombre?: string;
  padre_email?: string;
  colegio_nombre?: string;
  paradas?: Parada[];
  ruta_id?: string;
};

export type Parada = {
  id: string;
  estudiante_id: string;
  colegio_id: string;
  tipo: 'Recogida' | 'Entrega';
  sub_tipo: 'Principal' | 'Secundaria';
  direccion: string;
  calle: string | null;
  numero: string | null;
  lat: number;
  lng: number;
  activo: boolean;
};


export type Conductor = {
  id: string;
  nombre: string;
  apellido: string;
  licencia: string;
  telefono: string | null;
  activo: boolean;
  avatar_url: string | null;
  colegio_id: string;
  creado_por: string;
  fecha_creacion: string;
  // Join fields
  colegio_nombre?: string;
  placa_autobus?: string | null;
};

export type Autobus = {
  id: string;
  matricula: string;
  capacidad: number;
  imei_gps: string;
  estado: 'activo' | 'inactivo' | 'mantenimiento';
  colegio_id: string;
  conductor_id: string | null;
  ruta_id: string | null;
  creado_por: string;
  // Campos join desde la vista
  colegio_nombre?: string;
  conductor_nombre?: string;
  ruta_nombre?: string;
  ruta_estudiantes_count?: number;
  conductor?: Conductor | null;
  bus_asignado?: { matricula: string }[] | null;
  // New fields from table definition
  modelo_camara?: string | null;
  last_valid_latitude?: number | null;
  last_valid_longitude?: number | null;
  speed?: number | null;
  course?: number | null;
  device_time?: string | null;
  server_time?: string | null;
  address?: string | null;
  wox_device_id?: number | null;
};


export type OptimizedRouteResult = {
  routeOrder: string[];
  estimatedTravelTime: number;
  polyline?: string;
  googleMapsUrl?: string;
  routeMapImageUrl?: string;
};

export type Ruta = {
  id: string;
  nombre: string;
  hora_salida_manana: string | null; // Formato HH:mm
  hora_salida_tarde: string | null; // Formato HH:mm
  colegio_id: string;
  creado_por: string;
  fecha_creacion: string;
  estudiantes_count: number;
  ruta_optimizada_recogida: OptimizedRouteResult | null;
  ruta_optimizada_entrega: OptimizedRouteResult | null;
  colegio?: Colegio;
  paradas?: Parada[];
  estudiantes?: Estudiante[];
};

export type RutaEstudiante = {
    ruta_id: string;
    estudiante_id: string;
    parada_id: string;
};

export type Plan = {
  id: string;
  nombre_plan: string;
  monedas: number;
  precio_usd: number;
  bgColor: string;
  textColor: string;
};

export type Viaje = {
  id: string;
  ruta: string;
  conductor: string;
  autobus: string;
  estado: 'activo' | 'suspendido' | 'papelera';
}

// Tipo específico para la página de seguimiento, basado en la vista v_autobuses_rel
export type TrackedBus = {
  id: string; // bus id
  matricula: string;
  conductor: Conductor | null;
  ruta: Ruta | null;
  last_valid_latitude?: number | null;
  last_valid_longitude?: number | null;
}

export type Incidencia = {
    id: string;
    created_at?: string;
    updated_at?: string;
    estudiante_id: string;
    padre_id: string;
    colegio_id: string;
    fecha_incidente: string;
    observacion: string;
    tipo_solicitud: 'video' | 'imagen' | 'general';
    status: 'nuevo' | 'abierto' | 'en_proceso' | 'resuelto' | 'no_resuelto' | 'cerrado';
    resolucion: string | null;
    asignado_a: string | null;
    ruta_id: string | null;
    autobus_id: string | null;
};
