"use client";
import { useState } from "react";
import {
  Share2,
  Copy,
  MessageCircle,
  Printer,
  FileDown,
  ArrowUpRight,
  ClipboardList,
} from "lucide-react";
import type { Quotation } from "@/domain/quotation/models";
import { quotationText, whatsappUrl } from "@/lib/sharing";
import { Button, Dialog, Notice } from "./ui";
export function ShareActions({ quotation }: { quotation: Quotation }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Share2 size={18} />
        Compartir cotización
      </Button>
      {open && (
        <Dialog title="Compartir cotización" onClose={() => setOpen(false)}>
          <p className="muted">Elige cómo enviar la cotización al cliente.</p>
          <div className="share-options">
            <a
              className="share-option whatsapp"
              href={whatsappUrl(quotation)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={22} />
              <span>
                <strong>WhatsApp</strong>
                <small>Abrir el mensaje para enviar</small>
              </span>
              <ArrowUpRight size={18} />
            </a>
            <button
              className="share-option"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(quotationText(quotation));
                  setFeedback("Cotización copiada");
                  setError(false);
                } catch {
                  setFeedback(
                    "No se pudo copiar. Selecciona el texto de la vista previa.",
                  );
                  setError(true);
                }
              }}
            >
              <Copy size={22} />
              <span>
                <strong>Copiar texto</strong>
                <small>Copiar el desglose completo</small>
              </span>
            </button>
            <a
              className="share-option"
              href={`/cotizaciones/${quotation.number}/imprimir`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Printer size={22} />
              <span>
                <strong>Imprimir ticket 80 mm</strong>
                <small>Abrir formato térmico</small>
              </span>
            </a>
            <a
              className="share-option"
              href={`/api/cotizaciones/${quotation.number}/pdf`}
              download
            >
              <FileDown size={22} />
              <span>
                <strong>Descargar PDF</strong>
                <small>Documento A4 monocromático</small>
              </span>
            </a>
            <a
              className="share-option"
              href={`/cotizaciones/${quotation.number}/interno`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ClipboardList size={22} />
              <span>
                <strong>Imprimir voucher interno</strong>
                <small>Formato del taller sin precios</small>
              </span>
              <ArrowUpRight size={18} />
            </a>
            <a
              className="share-option"
              href={`/cotizaciones/${quotation.number}/imprimir?formato=a4`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Printer size={22} />
              <span>
                <strong>Imprimir A4</strong>
                <small>Abrir formato de hoja completa</small>
              </span>
            </a>
          </div>
          {feedback && <Notice error={error}>{feedback}</Notice>}
          <details className="message-preview">
            <summary>Vista previa del texto</summary>
            <pre>{quotationText(quotation)}</pre>
          </details>
        </Dialog>
      )}
    </>
  );
}
