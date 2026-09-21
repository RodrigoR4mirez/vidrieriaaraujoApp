"use client";
import { clearDraftCaches } from "@/lib/quotation-draft-cache";
import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calculator, Library, LogOut, RefreshCw } from "lucide-react";
import { logoutAction } from "@/app/actions";
import type { ReactNode } from "react";

function PrimaryLink({ href, label, active, children }: { href: string; label: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      prefetch
      className={`primary-nav-link${active ? " active" : ""}`}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={label}
    >
      {children}
      <span className="navigation-tooltip">{label}</span>
      {active && <span className="navigation-active-bar" aria-hidden="true" />}
    </Link>
  );
}

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const catalogsActive = pathname === "/catalogo" || pathname.startsWith("/catalogo/") || pathname.startsWith("/perfiles") || pathname.startsWith("/catalogos");
  const quotationActive = pathname.startsWith("/cotizador") || pathname.startsWith("/cotizaciones");
  const refreshButton = (
    <button
      type="button"
      className="navigation-icon-button"
      title="Actualizar datos"
      aria-label="Actualizar datos"
      aria-busy={refreshing}
      disabled={refreshing}
      onClick={() => startRefresh(() => router.refresh())}
    >
      <RefreshCw size={19} className={refreshing ? "refresh-spin" : undefined} />
      <span className="navigation-tooltip">Actualizar datos</span>
    </button>
  );
  const logoutButton = (
    <form action={logoutAction} onSubmit={clearDraftCaches}>
      <button type="submit" className="navigation-icon-button" title="Cerrar sesión" aria-label="Cerrar sesión">
        <LogOut size={19} />
        <span className="navigation-tooltip">Cerrar sesión</span>
      </button>
    </form>
  );
  return (
    <nav className="navigation no-print" aria-label="Navegación principal">
      <div className="navigation-topbar">
        <div className="navigation-group navigation-left">
          <Image className="navigation-logo" src="/brand/logo.png" width={34} height={34} alt="Distribuidora Araujo" priority />
          <span className="navigation-separator" aria-hidden="true" />
          <PrimaryLink href="/catalogo" label="Catálogos" active={catalogsActive}><Library size={22} strokeWidth={1.8} /></PrimaryLink>
        </div>
        <div className="navigation-group navigation-right">
          <PrimaryLink href="/cotizador" label="Cotización" active={quotationActive}><Calculator size={22} strokeWidth={1.8} /></PrimaryLink>
          <span className="navigation-separator" aria-hidden="true" />
          {refreshButton}
          {logoutButton}
        </div>
      </div>
      <div className="navigation-bottom" aria-label="Destinos principales">
        <PrimaryLink href="/catalogo" label="Catálogos" active={catalogsActive}><Library size={24} strokeWidth={1.8} /></PrimaryLink>
        <PrimaryLink href="/cotizador" label="Cotización" active={quotationActive}><Calculator size={24} strokeWidth={1.8} /></PrimaryLink>
      </div>
    </nav>
  );
}
