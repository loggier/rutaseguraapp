import type { Estudiante, Conductor, Autobus, Ruta, Plan, Viaje, Colegio, Profile } from "./types";

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
