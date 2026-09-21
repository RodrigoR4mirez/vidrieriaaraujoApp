import type { SectionTab } from "./section-tabs";

export const catalogSectionTabs: readonly SectionTab[] = [
  { href: "/catalogo", label: "Vidrios", icon: "glass" },
  { href: "/perfiles", label: "Perfiles de aluminio", icon: "profile" },
  { href: "/catalogos", label: "Catálogos base", icon: "base" },
];

export const quotationSectionTabs: readonly SectionTab[] = [
  { href: "/cotizador", label: "Nueva cotización", icon: "new" },
  { href: "/cotizaciones", label: "Historial", icon: "history" },
];
