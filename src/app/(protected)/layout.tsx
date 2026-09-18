import { requireSession } from "@/infrastructure/auth/session";
import { Navigation } from "@/components/navigation";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return (
    <div className="app-shell">
      <Navigation />
      <main>{children}</main>
      <footer className="app-footer no-print">
        <span>Distribuidora Araujo · Vidriería &amp; Aluminios</span>
        <span>Soluciones en vidrio para un mejor mañana</span>
      </footer>
    </div>
  );
}
