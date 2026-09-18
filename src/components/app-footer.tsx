import { Handshake, Shield, UsersRound } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="app-footer no-print">
      <div className="footer-credits">
        <p>© {new Date().getFullYear()} <strong>Distribuidora Araujo</strong></p>
        <p>Desarrollado por <strong className="footer-developer">R3 Consulting</strong></p>
        <p className="footer-rights">Todos los derechos reservados.</p>
      </div>
      <ul className="footer-values" aria-label="Nuestros valores">
        <li><Shield size={18} strokeWidth={1.7} aria-hidden="true" />Calidad</li>
        <li><Handshake size={19} strokeWidth={1.7} aria-hidden="true" />Confianza</li>
        <li><UsersRound size={19} strokeWidth={1.7} aria-hidden="true" />Tu proyecto, nuestra prioridad</li>
      </ul>
    </footer>
  );
}
