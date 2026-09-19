import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
export const metadata: Metadata = {
  title: "Distribuidora Araujo | Cotizaciones",
  description: "Vidriería & Aluminios · Sistema de cotización",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
