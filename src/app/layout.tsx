import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
