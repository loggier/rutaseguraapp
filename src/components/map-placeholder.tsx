import Image from "next/image";

export function MapPlaceholder() {
  return (
    <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner">
        <Image
            src="https://picsum.photos/seed/map-bg/1200/800"
            fill
            alt="Map background"
            className="object-cover opacity-20 blur-sm"
            data-ai-hint="map satellite"
        />
        <div className="z-10 text-center">
            <h3 className="text-lg font-semibold text-foreground">Mapa de Seguimiento en Vivo</h3>
            <p className="text-muted-foreground">La integración del mapa se mostrará aquí.</p>
        </div>
    </div>
  )
}
