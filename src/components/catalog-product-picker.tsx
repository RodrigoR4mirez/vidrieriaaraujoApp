"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Folder,
  Search,
  X,
} from "lucide-react";
import {
  Fragment,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  catalogFamilyMode,
  foldSearchText,
  matchesCatalogSearch,
  searchTokens,
} from "@/lib/catalog-search";

export type PickerFamily = {
  id: string;
  name: string;
};

export type PickerProduct = {
  id: string;
  code: string;
  description: string;
  familyId: string;
  familyName: string;
  measure: string;
  keyDetail: string;
  imagePath?: string;
};

type PickerOption =
  | { key: string; kind: "all-families" }
  | { key: string; kind: "family"; family: PickerFamily }
  | { key: string; kind: "product"; product: PickerProduct };

function productSearchText(product: PickerProduct) {
  return [
    product.code,
    product.description,
    product.familyName,
  ].join(" ");
}

function highlightedParts(text: string, query: string) {
  const characters = Array.from(text);
  const foldedCharacters: string[] = [];
  const sourceIndexes: number[] = [];
  characters.forEach((character, sourceIndex) => {
    for (const folded of Array.from(foldSearchText(character))) {
      foldedCharacters.push(folded);
      sourceIndexes.push(sourceIndex);
    }
  });
  const foldedText = foldedCharacters.join("");
  const highlighted = new Set<number>();
  for (const token of searchTokens(query)) {
    let offset = foldedText.indexOf(token);
    let matched = false;
    while (offset >= 0) {
      matched = true;
      for (let index = offset; index < offset + token.length; index++) {
        const sourceIndex = sourceIndexes[index];
        if (sourceIndex !== undefined) highlighted.add(sourceIndex);
      }
      offset = foldedText.indexOf(token, offset + token.length);
    }
    if (matched) continue;
    const compactToken = token.replace(/[^\p{L}\p{N}]/gu, "");
    const compactCharacters: string[] = [];
    const compactSourceIndexes: number[] = [];
    foldedCharacters.forEach((character, index) => {
      if (!/[\p{L}\p{N}]/u.test(character)) return;
      compactCharacters.push(character);
      compactSourceIndexes.push(sourceIndexes[index]);
    });
    const compactText = compactCharacters.join("");
    offset = compactText.indexOf(compactToken);
    while (compactToken && offset >= 0) {
      for (let index = offset; index < offset + compactToken.length; index++) {
        const sourceIndex = compactSourceIndexes[index];
        if (sourceIndex !== undefined) highlighted.add(sourceIndex);
      }
      offset = compactText.indexOf(compactToken, offset + compactToken.length);
    }
  }
  const parts: { text: string; highlighted: boolean }[] = [];
  characters.forEach((character, index) => {
    const isHighlighted = highlighted.has(index);
    const previous = parts.at(-1);
    if (previous?.highlighted === isHighlighted) previous.text += character;
    else parts.push({ text: character, highlighted: isHighlighted });
  });
  return parts;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return text;
  return highlightedParts(text, query).map((part, index) =>
    part.highlighted ? <mark key={index}>{part.text}</mark> : <Fragment key={index}>{part.text}</Fragment>,
  );
}

function ProductRow({ product, query }: { product: PickerProduct; query: string }) {
  return <>
    {product.imagePath && <span key="image" className="picker-product-image">
      <Image src={product.imagePath} alt="" fill sizes="48px" />
    </span>}
    <span key="copy" className="picker-product-copy">
      <strong key="description"><Highlight text={product.description} query={query} /></strong>
      <small key="details"><Highlight text={`${product.code} · ${product.measure} · ${product.familyName}`} query={query} /></small>
    </span>
    <span key="key-detail" className="picker-product-key"><Highlight text={product.keyDetail} query={query} /></span>
  </>;
}

function readRecent(storageKey: string) {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) && parsed.every((value) => typeof value === "string")
      ? parsed.slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

export function CatalogProductPicker({
  label,
  placeholder,
  disabledPlaceholder = "Primero elige la modalidad de venta",
  products,
  families,
  value,
  familyId,
  disabled,
  recentKey,
  onChange,
  onFamilyChange,
}: {
  label: string;
  placeholder: string;
  disabledPlaceholder?: string;
  products: PickerProduct[];
  families: PickerFamily[];
  value: string;
  familyId: string;
  disabled: boolean;
  recentKey: string;
  onChange: (id: string) => void;
  onFamilyChange: (id: string) => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readRecent(recentKey));
  const selected = products.find((product) => product.id === value);
  const familyMode = catalogFamilyMode(families.length);
  const selectedFamily = families.find((family) => family.id === familyId);

  useEffect(() => {
    if (value) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setQuery("");
      setActive(0);
    });
    return () => { cancelled = true; };
  }, [value]);

  const matchingProducts = useMemo(() => products.filter((product) =>
    (!familyId || product.familyId === familyId) &&
    matchesCatalogSearch(productSearchText(product), query),
  ), [familyId, products, query]);
  const matchingFamilies = useMemo(() => families.filter((family) =>
    matchesCatalogSearch(family.name, query),
  ), [families, query]);
  const productsInOtherFamilies = useMemo(() => familyId && query.trim()
    ? products.filter((product) => product.familyId !== familyId &&
      matchesCatalogSearch(productSearchText(product), query)).length
    : 0, [familyId, products, query]);
  const recentProducts = recentIds.flatMap((recentId) => {
    const product = products.find((entry) => entry.id === recentId && (!familyId || entry.familyId === familyId));
    return product ? [product] : [];
  });

  const options = useMemo<PickerOption[]>(() => {
    if (familyMode === "folders") {
      if (!familyId && !query.trim())
        return families.map((family) => ({ key: `family-${family.id}`, kind: "family", family }));
      if (!familyId)
        return [
          ...matchingFamilies.map((family) => ({ key: `family-${family.id}`, kind: "family" as const, family })),
          ...matchingProducts.map((product) => ({ key: `product-${product.id}`, kind: "product" as const, product })),
        ];
      return [
        { key: "all-families", kind: "all-families" },
        ...matchingProducts.map((product) => ({ key: `product-${product.id}`, kind: "product" as const, product })),
      ];
    }
    if (query.trim())
      return matchingProducts.map((product) => ({ key: `product-${product.id}`, kind: "product", product }));
    return matchingProducts.map((product) => ({ key: `product-${product.id}`, kind: "product", product }));
  }, [families, familyId, familyMode, matchingFamilies, matchingProducts, query]);

  const activeIndex = Math.max(0, Math.min(active, Math.max(0, options.length - 1)));

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>(`[data-picker-option="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function remember(productId: string) {
    setRecentIds((current) => {
      const next = [productId, ...current.filter((id) => id !== productId)].slice(0, 3);
      try { window.sessionStorage.setItem(recentKey, JSON.stringify(next)); }
      catch { /* Recents are an optional, ephemeral convenience. */ }
      return next;
    });
  }

  function chooseProduct(product: PickerProduct) {
    onChange(product.id);
    setQuery("");
    setOpen(false);
    remember(product.id);
  }

  function chooseOption(option: PickerOption) {
    if (option.kind === "product") chooseProduct(option.product);
    else if (option.kind === "family") {
      onFamilyChange(option.family.id);
      setQuery("");
      setActive(0);
      setOpen(true);
    } else {
      onFamilyChange("");
      setActive(0);
      setOpen(true);
    }
  }

  function clear() {
    onChange("");
    onFamilyChange("");
    setQuery("");
    setOpen(true);
    input.current?.focus();
  }

  const displayValue = selected ? selected.description : query;
  const hasNoResults = query.trim() && !matchingProducts.length &&
    (familyMode === "chips" || familyId || !matchingFamilies.length);
  return <div ref={root} className="field catalog-picker" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <label htmlFor={id}>{label}</label>
    <div className={`catalog-picker-control ${disabled ? "disabled" : ""}`}>
      <Search size={18} aria-hidden="true" />
      {familyMode === "folders" && selectedFamily && <span className="picker-family-tag">
        {selectedFamily.name}
        <button type="button" aria-label={`Quitar familia ${selectedFamily.name}`} onClick={() => {
          onFamilyChange("");
          setOpen(true);
          input.current?.focus();
        }}><X size={12} /></button>
      </span>}
      <input ref={input} id={id} role="combobox" autoComplete="off"
        aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`}
        aria-activedescendant={open && options[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
        disabled={disabled} value={displayValue}
        placeholder={disabled ? disabledPlaceholder : placeholder}
        onFocus={(event) => {
          setOpen(true);
          if (selected) event.currentTarget.select();
        }}
        onChange={(event) => {
          if (selected) onChange("");
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) { setOpen(true); setActive(0); return; }
            setActive(() => {
              const length = options.length;
              if (!length) return 0;
              return (activeIndex + (event.key === "ArrowDown" ? 1 : -1) + length) % length;
            });
          } else if (event.key === "Enter" && open && options[activeIndex]) {
            event.preventDefault();
            chooseOption(options[activeIndex]);
          } else if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
          }
        }} />
      {(displayValue || familyId) && !disabled && <button type="button" className="picker-clear"
        aria-label="Limpiar búsqueda y familia" onClick={clear}><X size={16} /></button>}
      <button type="button" className="picker-chevron" disabled={disabled}
        aria-label={open ? "Cerrar productos" : "Desplegar productos"}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          if (open) setOpen(false);
          else {
            setOpen(true);
            input.current?.focus();
          }
        }}>
        {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>
    </div>
    {open && !disabled && <div className="catalog-picker-dropdown">
      {familyMode === "chips" && <div className="picker-chips" aria-label="Filtrar por familia">
        <button type="button" className={!familyId ? "active" : ""} aria-pressed={!familyId}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => { onFamilyChange(""); setActive(0); }}>Todas</button>
        {families.map((family) => <button type="button" key={family.id}
          className={family.id === familyId ? "active" : ""} aria-pressed={family.id === familyId}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => { onFamilyChange(family.id); setActive(0); }}>{family.name}</button>)}
      </div>}
      <div id={`${id}-list`} role="listbox" aria-label="Productos disponibles" className="picker-scroll-area">
        {familyMode === "folders" && !familyId && !query.trim() && <p className="picker-guidance">
          Elige una familia o escribe para buscar
        </p>}
        {familyMode === "folders" && !familyId && query.trim() && matchingFamilies.length > 0 &&
          <p className="picker-section-title">Familias</p>}
        {familyMode === "chips" && !query.trim() && recentProducts.length > 0 && <>
          <p key="recent-title" className="picker-section-title">Usados recientemente</p>
          {recentProducts.map((product) => {
            return <button key={`recent-${product.id}`} type="button" className="picker-product-row"
              onMouseDown={(event) => event.preventDefault()} onClick={() => chooseProduct(product)}>
              <ProductRow product={product} query="" />
            </button>;
          })}
        </>}
        {familyMode === "chips" && !query.trim()
          ? families.filter((family) => !familyId || family.id === familyId).map((family) => {
              const group = matchingProducts.filter((product) => product.familyId === family.id);
              if (!group.length) return null;
              return <Fragment key={family.id}>
                <p key="group-title" className="picker-section-title">{family.name} · {group.length}</p>
                {group.map((product) => {
                  const index = options.findIndex((option) => option.kind === "product" && option.product.id === product.id);
                  return <button key={product.id} id={`${id}-option-${index}`} data-picker-option={index}
                    role="option" aria-selected={product.id === value} tabIndex={-1} type="button"
                    className={`picker-product-row ${index === activeIndex ? "active" : ""}`}
                    onMouseEnter={() => setActive(index)} onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseProduct(product)}><ProductRow product={product} query="" /></button>;
                })}
              </Fragment>;
            })
          : options.map((option, index) => {
              const shared = {
                id: `${id}-option-${index}`,
                "data-picker-option": index,
                onMouseEnter: () => setActive(index),
                onMouseDown: (event: ReactMouseEvent) => event.preventDefault(),
                onClick: () => chooseOption(option),
              };
              if (option.kind === "all-families") return <button {...shared} key={option.key}
                type="button" role="option" aria-selected={false} tabIndex={-1}
                className={`picker-back-row ${index === activeIndex ? "active" : ""}`}>← Todas las familias</button>;
              if (option.kind === "family") {
                const count = products.filter((product) => product.familyId === option.family.id).length;
                return <button {...shared} key={option.key} type="button" role="option"
                  aria-selected={option.family.id === familyId} tabIndex={-1}
                  className={`picker-family-row ${index === activeIndex ? "active" : ""}`}>
                  <Folder key="icon" size={18} />
                  <span key="name"><Highlight text={option.family.name} query={query} /></span>
                  <small key="count">{count}</small><ChevronRight key="chevron" size={16} />
                </button>;
              }
              const firstProductIndex = options.findIndex((entry) => entry.kind === "product");
              const showProductTitle = familyMode === "folders" && !familyId && query.trim() && index === firstProductIndex;
              return <Fragment key={option.key}>
                {showProductTitle && <p key="products-title" className="picker-section-title">Productos</p>}
                <button key="product" {...shared} type="button" role="option" aria-selected={option.product.id === value}
                  tabIndex={-1} className={`picker-product-row ${index === activeIndex ? "active" : ""}`}>
                  <ProductRow product={option.product} query={query} />
                </button>
              </Fragment>;
            })}
        {hasNoResults && <div className="picker-empty">
          <strong>No hay productos con &apos;{query}&apos;</strong>
          {productsInOtherFamilies > 0 && <span>Hay {productsInOtherFamilies} resultados en otras familias.{" "}
            <button type="button" onClick={() => onFamilyChange("")}>Buscar en todas</button></span>}
        </div>}
      </div>
      <div className="picker-keyboard-help">↑↓ para moverte · Enter para elegir · Esc para cerrar</div>
    </div>}
  </div>;
}
