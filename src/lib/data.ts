import type { Estudiante, Conductor, Autobus, Ruta, Plan, Viaje, Colegio, Profile } from "./types";

export const estudiantes: Estudiante[] = [
  {
    id: "1",
    student_id: "E001",
    nombre: "Ana",
    apellido: "García",
    email: "ana.garcia@example.com",
    telefono: "555-0101",
    activo: true,
    fecha_creacion: "2023-01-15",
    avatar_url: "https://picsum.photos/seed/student-1/40/40",
    padre_nombre: "Carlos García",
    padre_id: "p001",
    colegio_id: "c001",
    creado_por: "u001",
  },
];

export const conductores: Conductor[] = [
    {
        id: "1",
        nombre: "Miguel",
        apellido: "Torres",
        email: "miguel.t@example.com",
        telefono: "555-0201",
        activo: true,
        fecha_creacion: "2022-05-20",
        avatar_url: "https://picsum.photos/seed/driver-1/40/40",
        licencia: "T12345678",
        colegio_id: "c001",
        creado_por: "u001",
    },
    {
        id: "2",
        nombre: "Elena",
        apellido: "Ramirez",
        email: "elena.r@example.com",
        telefono: "555-0202",
        activo: false,
        fecha_creacion: "2023-10-05",
        avatar_url: "https://picsum.photos/seed/driver-2/40/40",
        licencia: "R87654321",
        colegio_id: "c001",
        creado_por: "u001",
    }
];

export const autobuses: Autobus[] = [
    {
        id: "B001",
        matricula: "XYZ 123",
        capacidad: 40,
        conductor_id: "1",
        conductor_nombre: "Miguel Torres",
        estado: 'activo',
        colegio_id: "c001",
        ruta_id: "R01",
        imei_gps: "123456789012345",
        creado_por: "u001"
    },
    {
        id: "B002",
        matricula: "ABC 789",
        capacidad: 35,
        conductor_nombre: "Elena Ramirez",
        conductor_id: "2",
        estado: 'inactivo',
        colegio_id: "c001",
        ruta_id: "R02",
        imei_gps: "123456789012346",
        creado_por: "u001"
    },
    {
        id: "B003",
        matricula: "DEF 456",
        capacidad: 40,
        estado: 'mantenimiento',
        colegio_id: "c002",
        ruta_id: null,
        conductor_id: null,
        imei_gps: "123456789012347",
        creado_por: "u001"
    }
];

export const rutas: Ruta[] = [];

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
