import { Brand } from "./brand";
import { limaDate } from "@/lib/formatting";
import type { ReactNode } from "react";
export function PageHeader({
  title,
  eyebrow,
  description,
  date,
  draft = false,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  date?: string;
  draft?: boolean;
}) {
  return (
    <header className="page-header glass">
      <div>
        <p className="eyebrow">{draft && <span className="draft-light" aria-hidden="true" />}{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
        {date && <p className="date">{limaDate(date)}</p>}
      </div>
      <Brand />
    </header>
  );
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel glass ${className}`}>{children}</section>;
}
