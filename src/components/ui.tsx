"use client";
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { X, Minus, Plus } from "lucide-react";
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return <button {...props} className={`button ${variant} ${className}`} />;
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function StatusBadge({ status }: { status: "ACTIVE" | "HIDDEN" }) {
  return (
    <span className={`badge ${status === "ACTIVE" ? "active" : "hidden"}`}>
      {status === "ACTIVE" ? "Activo" : "Oculto"}
    </span>
  );
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={onClose}
      className="dialog glass"
    >
      <div className="section-heading">
        <h2 id={id}>{title}</h2>
        <button className="icon-button" aria-label="Cerrar" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function QuantityControl({
  value,
  onChange,
  label = "Cantidad de paños / piezas",
}: {
  label?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="stepper">
        <button
          type="button"
          aria-label="Disminuir cantidad"
          disabled={value <= 1}
          onClick={() => onChange(Math.max(1, value - 1))}
        >
          <Minus size={18} />
        </button>
        <input
          id={id}
          aria-label="Cantidad"
          type="number"
          min="1"
          step="1"
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          required
        />
        <button
          type="button"
          aria-label="Aumentar cantidad"
          onClick={() => onChange((Number.isFinite(value) ? value : 0) + 1)}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">◇</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
