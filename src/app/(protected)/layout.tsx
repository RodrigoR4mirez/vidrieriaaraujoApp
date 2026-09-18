import { AppFooter } from "@/components/app-footer";
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
      <AppFooter />
    </div>
  );
}
