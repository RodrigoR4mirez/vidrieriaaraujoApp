"use client";
import { Button } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel glass">
      <h1>No se pudo cargar la información</h1>
      <p>
        Verifica la conexión y la configuración del almacenamiento privado. Tus
        datos confirmados se conservan.
      </p>
      <Button onClick={reset}>Volver a intentar</Button>
    </section>
  );
}
