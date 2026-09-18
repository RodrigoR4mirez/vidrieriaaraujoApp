import Link from "next/link";
export default function NotFound() {
  return (
    <main className="panel">
      <h1>No encontramos esta proforma</h1>
      <Link href="/proformas">Volver al histórico</Link>
    </main>
  );
}
