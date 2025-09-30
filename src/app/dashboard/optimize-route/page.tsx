import { PageHeader } from "@/components/page-header";
import { RouteOptimizationForm } from "./route-optimization-form";

export default function OptimizeRoutePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Herramienta de Optimización de Rutas (IA)"
        description="Utiliza inteligencia artificial para encontrar la ruta más rápida y eficiente para recoger a los estudiantes."
      />
      <RouteOptimizationForm />
    </div>
  );
}
