import { redirect } from "next/navigation";
import { session } from "@/infrastructure/auth/session";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
export default async function LoginPage() {
  if (await session()) redirect("/cotizador");
  return (
    <main className="login-page">
      <section className="login-card glass">
        <Brand large />
        <p className="login-subtitle">Sistema de Cotización y Proformas</p>
        <LoginForm />
      </section>
      <p className="login-footer">Soluciones en vidrio para un mejor mañana</p>
    </main>
  );
}
