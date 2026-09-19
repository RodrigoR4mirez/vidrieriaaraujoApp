import Link from "next/link";
export default function NotFound() {
  return (
    <main className="panel">
      <h1>No encontramos esta cotización</h1>
      <Link href="/cotizaciones">Volver al histórico</Link>
    </main>
  );
}
