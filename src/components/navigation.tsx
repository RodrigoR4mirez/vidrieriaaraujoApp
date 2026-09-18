"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Layers, Settings2, History, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions";
export function Navigation() {
  const pathname = usePathname();
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
      <form action={logoutAction}>
        <button title="Cerrar sesión" aria-label="Cerrar sesión">
          <LogOut size={17} />
          <span>Salir</span>
        </button>
      </form>
    </nav>
  );
}
