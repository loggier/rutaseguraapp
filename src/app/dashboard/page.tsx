import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ArrowUpRight, Users, Bus, Route, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const dailyTripsData = [
  { name: 'Lun', viajes: 12 },
  { name: 'Mar', viajes: 15 },
  { name: 'Mié', viajes: 14 },
  { name: 'Jue', viajes: 16 },
  { name: 'Vie', viajes: 18 },
  { name: 'Sáb', viajes: 5 },
  { name: 'Dom', viajes: 2 },
];

const studentGrowthData = [
    { month: 'Ene', estudiantes: 120 },
    { month: 'Feb', estudiantes: 135 },
    { month: 'Mar', estudiantes: 150 },
    { month: 'Abr', estudiantes: 148 },
    { month: 'May', estudiantes: 160 },
    { month: 'Jun', estudiantes: 175 },
];

const recentActivities = [
    { type: 'Nuevo Conductor', description: 'Elena Ramirez se ha registrado', time: 'hace 5 min' },
    { type: 'Ruta Actualizada', description: 'Ruta Norte ha sido modificada', time: 'hace 30 min' },
    { type: 'Pago Recibido', description: 'Carlos García ha comprado 500 monedas', time: 'hace 1 hora' },
    { type: 'Alerta de Mantenimiento', description: 'Autobús ABC 789 requiere revisión', time: 'hace 4 horas' },
];


export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Estudiantes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">175</div>
            <p className="text-xs text-muted-foreground">
              +15.2% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Autobuses Activos
            </CardTitle>
            <Bus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 / 3</div>
            <p className="text-xs text-muted-foreground">
              1 en mantenimiento
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rutas Operativas</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Turnos de mañana y tarde
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              1 conductor, 1 mantenimiento
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Crecimiento de Estudiantes</CardTitle>
            <CardDescription>
              Evolución mensual de estudiantes registrados.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={studentGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="estudiantes" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas acciones y alertas en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableBody>
                    {recentActivities.map((activity, index) => (
                        <TableRow key={index}>
                            <TableCell>
                                <div className="font-medium">{activity.type}</div>
                                <div className="text-sm text-muted-foreground">{activity.description}</div>
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">{activity.time}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
