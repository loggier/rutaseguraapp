
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
};

export type Estudiante = User & {
  rol: "estudiante";
  id_estudiante: string;
  nota?: string;
  tutor: string;
  saldo_monedas: number;
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
