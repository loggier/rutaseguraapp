import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { planes } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Coins, Check } from "lucide-react";

export default function PlansPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Planes de Monedas"
        description="Adquiere monedas para gestionar los viajes y servicios de tus estudiantes."
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {planes.map((plan) => (
          <Card key={plan.id} className={cn("flex flex-col", plan.nombre_plan === "Estándar" && "border-primary ring-2 ring-primary")}>
            <CardHeader className={cn("rounded-t-lg", plan.bgColor)}>
              <CardTitle className={cn("font-headline", plan.textColor)}>{plan.nombre_plan}</CardTitle>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">${plan.precio_usd}</span>
                <span className="text-muted-foreground">/ USD</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between p-6 space-y-6">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Coins className={cn("h-8 w-8", plan.textColor)} />
                        <div>
                            <p className="text-2xl font-bold">{plan.monedas.toLocaleString('es-ES')} monedas</p>
                            <p className="text-sm text-muted-foreground">Para transferencias y pagos</p>
                        </div>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Acceso a todas las funciones</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Soporte por correo electrónico</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /> Historial de transacciones</li>
                    </ul>
                </div>
              <Button className={cn("w-full", plan.nombre_plan !== "Estándar" && "variant-outline")}>
                {plan.nombre_plan === "Estándar" ? "Comprar Plan Popular" : "Comprar Plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
