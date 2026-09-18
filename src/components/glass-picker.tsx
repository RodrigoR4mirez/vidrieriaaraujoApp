"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { productDetails, type BaseValue, type Product } from "@/domain/catalogs/models";

function glassLabel(product: Product, values: BaseValue[]) {
  const { family, colorFinish, thickness, cathedralDesign } = productDetails(product, values);
  const cathedral = cathedralDesign || /catedral/i.test(family);
  const size = product.sheetWidthCm && product.sheetHeightCm
    ? `${product.sheetWidthCm} × ${product.sheetHeightCm} cm` : "";
  return [cathedral ? ["Catedral", cathedralDesign].filter(Boolean).join(" ") : "",
    colorFinish, thickness, size].filter(Boolean).join(" · ");
}

export function GlassPicker({ products, values, value, disabled, onChange }: {
  products: Product[]; values: BaseValue[]; value: string; disabled: boolean;
  onChange: (id: string) => void;
}) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = products.find((p) => p.id === value);
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);
  function choose(index: number) {
    if (!products[index] || disabled) return;
    onChange(products[index].id);
    setOpen(false);
    button.current?.focus();
  }
  function toggle() {
    setActive(Math.max(0, products.findIndex((p) => p.id === value)));
    setOpen(!open);
  }
  const content = (product: Product) => <span>{glassLabel(product, values)} <small>({product.code})</small></span>;
  return <div className="field glass-picker" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <label id={`${id}-label`} htmlFor={id}>Tipo de vidrio</label>
    <button ref={button} id={id} type="button" role="combobox" className="glass-picker-trigger"
      disabled={disabled} aria-labelledby={`${id}-label`} aria-expanded={open}
      aria-haspopup="listbox" aria-controls={`${id}-list`} aria-required="true"
      aria-activedescendant={open ? `${id}-option-${active}` : undefined}
      onClick={toggle} onKeyDown={(event) => {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          const last = products.length - 1;
          setActive(event.key === "Home" ? 0 : event.key === "End" ? last :
            !open ? Math.max(0, products.findIndex((p) => p.id === value)) :
            Math.max(0, Math.min(last, active + (event.key === "ArrowDown" ? 1 : -1))));
          setOpen(true);
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (open) choose(active); else toggle();
        } else if (event.key === "Escape") {
          event.preventDefault(); setOpen(false);
        } else if (event.key === "Tab") {
          setOpen(false);
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const index = products.findIndex((p) => glassLabel(p, values).toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
          if (index >= 0) { setActive(index); setOpen(true); }
        }
      }}>
      {selected ? content(selected) : <span>Selecciona el vidrio</span>}
      <ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && !disabled && <div ref={list} id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="glass-picker-list">
      {products.map((product, index) => <button key={product.id} id={`${id}-option-${index}`}
        type="button" role="option" aria-selected={product.id === value} tabIndex={-1}
        className={index === active ? "active" : ""}
        onMouseDown={(event) => event.preventDefault()} onClick={() => choose(index)}>
        {content(product)}
      </button>)}
    </div>}
  </div>;
}
