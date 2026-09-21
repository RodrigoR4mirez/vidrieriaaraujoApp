"use client";

import Link from "next/link";
import { History, SlidersHorizontal, FilePlus2 } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
type SectionIcon = ComponentType<IconProps>;

function GlassIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1.5" />
      <path d="M8 11l4-4M9 16l6-6" />
    </svg>
  );
}

function ProfileIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 4h4v11h8V4h4v16H4Z" />
    </svg>
  );
}

export type SectionIconName = "glass" | "profile" | "base" | "new" | "history";
export type SectionTab = {
  href: string;
  label: string;
  icon: SectionIconName;
};

const iconMap: Record<SectionIconName, SectionIcon> = {
  glass: GlassIcon,
  profile: ProfileIcon,
  base: SlidersHorizontal,
  new: FilePlus2,
  history: History,
};

export function SectionTabs({ items }: { items: readonly SectionTab[] }) {
  const pathname = usePathname();
  return (
    <nav className="section-tabs" aria-label="Secciones">
      {items.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const Icon = iconMap[icon];
        return (
          <Link
            key={href}
            href={href}
            className={active ? "active" : undefined}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            title={label}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="section-tab-tooltip">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
