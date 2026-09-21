import type { ReactNode } from "react";
import { SectionTabs, type SectionTab } from "./section-tabs";
export function PageHeader({
  tabs,
  title,
  meta,
  actions,
}: {
  tabs: readonly SectionTab[];
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        <SectionTabs items={tabs} />
        <h1>{title}</h1>
        {meta && <div className="page-header-meta">{meta}</div>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
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
