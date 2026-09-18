"use client";
import { clearDraftCaches } from "@/lib/quotation-draft-cache";
import Link from "next/link";
import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calculator, Layers, Settings2, History, LogOut, RefreshCw } from "lucide-react";
import { logoutAction } from "@/app/actions";
export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  return (
    <nav className="navigation no-print" aria-label="Navegación principal">
      <div>
        {[
          ["/cotizador", "Cotizador", Calculator],
          ["/catalogo", "Vidrios", Layers],
          ["/catalogos", "Catálogos base", Settings2],
          ["/proformas", "Histórico", History],
        ].map(([href, label, Icon]) =>
          typeof href === "string" &&
          typeof label === "string" &&
          typeof Icon !== "string" ? (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className={
                pathname.startsWith(href) &&
                !(href === "/catalogo" && pathname.startsWith("/catalogos"))
                  ? "selected"
                  : ""
              }
            >
              <Icon size={17} />
              {label}
            </Link>
          ) : null,
        )}
      </div>
      <div className="navigation-actions">
        <button type="button" title="Actualizar datos" aria-label="Actualizar datos" aria-busy={refreshing}
          disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>
          <RefreshCw size={17} className={refreshing ? "refresh-spin" : undefined} />
          <span>{refreshing ? "Actualizando…" : "Actualizar"}</span>
        </button>
      <form action={logoutAction} onSubmit={clearDraftCaches}>
        <button title="Cerrar sesión" aria-label="Cerrar sesión">
          <LogOut size={17} />
          <span>Salir</span>
        </button>
      </form>
      </div>
    </nav>
  );
}
