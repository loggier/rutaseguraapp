import type { Estudiante, Conductor, Autobus, Ruta, Plan, Viaje, Colegio, Profile } from "./types";

export const estudiantes: Estudiante[] = [
  {
    id: "1",
    id_estudiante: "E001",
    nombre: "Ana",
    apellido: "García",
    email: "ana.garcia@example.com",
    telefono: "555-0101",
    rol: "estudiante",
    estado: "activo",
    fecha_registro: "2023-01-15",
    avatarUrl: "https://picsum.photos/seed/student-1/40/40",
    tutor: "Carlos García",
    saldo_monedas: 50,
  },
  {
    id: "2",
    id_estudiante: "E002",
    nombre: "Luis",
    apellido: "Rodriguez",
    email: "luis.rodriguez@example.com",
    telefono: "555-0102",
    rol: "estudiante",
    estado: "en_revision",
    fecha_registro: "2023-09-01",
    avatarUrl: "https://picsum.photos/seed/student-2/40/40",
    tutor: "Maria Rodriguez",
    saldo_monedas: 0,
  },
  {
    id: "3",
    id_estudiante: "E003",
    nombre: "Sofia",
    apellido: "Martinez",
    email: "sofia.martinez@example.com",
    telefono: "555-0103",
    rol: "estudiante",
    estado: "suspendido",
    fecha_registro: "2022-08-20",
    avatarUrl: "https://picsum.photos/seed/student-3/40/40",
    tutor: "Juan Martinez",
    saldo_monedas: 10,
  },
  {
    id: "4",
    id_estudiante: "E004",
    nombre: "Jorge",
    apellido: "Hernandez",
    email: "jorge.h@example.com",
    telefono: "555-0104",
    rol: "estudiante",
    estado: "activo",
    fecha_registro: "2023-02-10",
    avatarUrl: "https://picsum.photos/seed/student-4/40/40",
    tutor: "Laura Hernandez",
    saldo_monedas: 120,
  },
];

export const conductores: Conductor[] = [
    {
        id: "1",
        nombre: "Miguel",
        apellido: "Torres",
        email: "miguel.t@example.com",
        telefono: "555-0201",
        rol: "conductor",
        estado: "activo",
        fecha_registro: "2022-05-20",
        avatarUrl: "https://picsum.photos/seed/driver-1/40/40",
        licencia: "T12345678",
        direccion: "Calle Falsa 123",
        email_comunicacion: "miguel.torres.comm@example.com",
        aprobado: true,
        autobusId: "B001",
    },
    {
        id: "2",
        nombre: "Elena",
        apellido: "Ramirez",
        email: "elena.r@example.com",
        telefono: "555-0202",
        rol: "conductor",
        estado: "en_revision",
        fecha_registro: "2023-10-05",
        avatarUrl: "https://picsum.photos/seed/driver-2/40/40",
        licencia: "R87654321",
        direccion: "Avenida Siempreviva 742",
        email_comunicacion: "elena.ramirez.comm@example.com",
        aprobado: false,
    }
];

export const autobuses: Autobus[] = [
    {
        id: "B001",
        matricula: "XYZ 123",
        capacidad: 40,
        conductorId: "1",
        conductorNombre: "Miguel Torres",
        estado: 'en_ruta',
    },
    {
        id: "B002",
        matricula: "ABC 789",
        capacidad: 35,
        conductorNombre: "Elena Ramirez",
        estado: 'detenido',
    },
    {
        id: "B003",
        matricula: "DEF 456",
        capacidad: 40,
        estado: 'mantenimiento',
    }
];

export const rutas: Ruta[] = [
    {
        id: "R01",
        nombre: "Ruta Norte",
        turno: "mañana",
        paradas_count: 12,
        estudiantes_count: 25,
        fecha_creacion: "2023-01-10",
    },
    {
        id: "R02",
        nombre: "Ruta Sur",
        turno: "tarde",
        paradas_count: 15,
        estudiantes_count: 30,
        fecha_creacion: "2023-01-12",
    },
    {
        id: "R03",
        nombre: "Ruta Centro",
        turno: "mañana",
        paradas_count: 8,
        estudiantes_count: 18,
        fecha_creacion: "2023-02-01",
    }
];

export const planes: Plan[] = [
    {
        id: "plan-basico",
        nombre_plan: "Básico",
        monedas: 100,
        precio_usd: 10,
        bgColor: "bg-blue-500/10",
        textColor: "text-blue-400"
    },
    {
        id: "plan-estandar",
        nombre_plan: "Estándar",
        monedas: 500,
        precio_usd: 45,
        bgColor: "bg-primary/10",
        textColor: "text-primary"
    },
    {
        id: "plan-premium",
        nombre_plan: "Premium",
        monedas: 1000,
        precio_usd: 80,
        bgColor: "bg-amber-500/10",
        textColor: "text-amber-400"
    }
];

export const viajes: Viaje[] = [
    { id: 'V001', ruta: 'Ruta Norte', conductor: 'Miguel Torres', autobus: 'XYZ 123', estado: 'activo' },
    { id: 'V002', ruta: 'Ruta Sur', conductor: 'Elena Ramirez', autobus: 'ABC 789', estado: 'suspendido' },
    { id: 'V003', ruta: 'Ruta Centro', conductor: 'Miguel Torres', autobus: 'XYZ 123', estado: 'activo' },
];

export const studentLocationsForOptimization = [
  { studentId: 'E001', latitude: 34.0522, longitude: -118.2437 },
  { studentId: 'E002', latitude: 34.055, longitude: -118.255 },
  { studentId: 'E003', latitude: 34.06, longitude: -118.24 },
  { studentId: 'E004', latitude: 34.045, longitude: -118.23 },
];

export const padres: Profile[] = [
    {
        id: "p001",
        nombre: "Carlos",
        apellido: "García",
        email: "carlos.garcia@example.com",
        rol: "padre",
        activo: true,
        colegio_id: "COLEGIO_ID_1"
    },
    {
        id: "p002",
        nombre: "Maria",
        apellido: "Rodriguez",
        email: "maria.r@example.com",
        rol: "padre",
        activo: true,
        colegio_id: "COLEGIO_ID_1"
    },
     {
        id: "p003",
        nombre: "Juan",
        apellido: "Martinez",
        email: "juan.m@example.com",
        rol: "padre",
        activo: false,
        colegio_id: "COLEGIO_ID_2"
    }
];
