



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
};

export type Parada = {
  id: string;
  estudiante_id: string;
  colegio_id: string;
  tipo: 'Recogida' | 'Entrega';
  sub_tipo: 'Principal' | 'Familiar/Academia';
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
  email: string;
  telefono: string;
  licencia: string;
  activo: boolean;
  avatar_url?: string | null;
  colegio_id: string;
  creado_por: string;
  fecha_creacion: string;
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
  // Campos join
  colegio_nombre?: string;
  conductor_nombre?: string;
  ruta_nombre?: string;
};


export type OptimizedRouteResult = {
  routeOrder: string[];
  estimatedTravelTime: number;
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
  colegio?: {
    nombre: string;
    id: string;
  };
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
