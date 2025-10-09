

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
  colegio_id: string;
  padre_id: string;
  creado_por: string;
  fecha_creacion: string;
  // Campos join
  padre_nombre?: string;
  padre_email?: string;
  colegio_nombre?: string;
};

export type Conductor = User & {
  rol: "conductor";
  licencia: string;
  direccion: string;
  email_comunicacion: string;
  aprobado: boolean;
  autobusId?: string;
};

export type Autobus = {
  id: string;
  matricula: string;
  capacidad: number;
  conductorId?: string;
  conductorNombre?: string;
  estado: 'en_ruta' | 'detenido' | 'mantenimiento';
};

export type Ruta = {
  id: string;
  nombre: string;
  turno: "mañana" | "tarde";
  paradas_count: number;
  estudiantes_count: number;
  fecha_creacion: string;
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

    
