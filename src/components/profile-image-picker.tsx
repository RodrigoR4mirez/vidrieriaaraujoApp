"use client";

import Image from "next/image";
import { Check, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { foldSearchText } from "@/lib/catalog-search";

type Option = { path: string; code: string };

export function profileImageCode(path: string) {
  return path.split("/").at(-1)?.replace(/\.[^.]+$/, "") || "";
}

export function filterProfileImageOptions(paths: string[], query: string): Option[] {
  const foldedQuery = foldSearchText(query).trim();
  return [...new Map(paths.map((path) => [path, { path, code: profileImageCode(path) }])).values()]
    .filter((option) => foldSearchText(option.code).includes(foldedQuery))
    .sort((left, right) => {
      const startsLeft = foldSearchText(left.code).startsWith(foldedQuery);
      const startsRight = foldSearchText(right.code).startsWith(foldedQuery);
      return Number(startsRight) - Number(startsLeft) || left.code.localeCompare(right.code, "es-PE");
    });
}

export function ProfileImagePicker({
  paths,
  value,
  onChange,
  typedCode,
}: {
  paths: string[];
  value: string;
  onChange: (path: string) => void;
  typedCode: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  const options = useMemo(() => filterProfileImageOptions(paths, query), [paths, query]);
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, options.length - 1));
  const selected = useMemo(() => paths.includes(value) ? { path: value, code: profileImageCode(value) } : value ? { path: value, code: profileImageCode(value) } : undefined, [paths, value]);
  const suggested = useMemo(() => {
    const code = foldSearchText(typedCode).trim();
    return code ? filterProfileImageOptions(paths, "").find((option) => foldSearchText(option.code) === code) : undefined;
  }, [paths, typedCode]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    if (restoreFocus) requestAnimationFrame(() => (value ? changeRef.current : triggerRef.current)?.focus());
  };
  const openPicker = () => {
    const all = filterProfileImageOptions(paths, "");
    setQuery("");
    setActiveIndex(Math.max(0, all.findIndex((option) => option.path === value)));
    setOpen(true);
  };
  const choose = (path: string) => {
    onChange(path);
    close(false);
    requestAnimationFrame(() => changeRef.current?.focus());
  };

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  });
  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const move: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 };
    if (event.key in move) {
      event.preventDefault();
      if (!options.length) return;
      setActiveIndex((current) => Math.max(0, Math.min(options.length - 1, current + move[event.key])));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (options[safeActiveIndex]) choose(options[safeActiveIndex].path);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  };

  return <div className="image-picker" ref={rootRef}>
    <div className="image-picker-label"><span id="profile-image-label">Imagen técnica</span><small>Opcional</small></div>
    {!open && !selected && <button type="button" className="image-picker-trigger" ref={triggerRef}
      aria-haspopup="listbox" aria-labelledby="profile-image-label" onClick={openPicker}>
      <Search size={20} /><span>Buscar imagen por código</span><small>{paths.length} imágenes</small>
    </button>}
    {!open && selected && <div className="image-picker-card">
      <span className="image-picker-card-thumb"><Image src={selected.path} alt={`Imagen técnica ${selected.code}`} fill sizes="132px" /></span>
      <strong>{selected.code}</strong>
      <button type="button" className="image-picker-change" ref={changeRef} onClick={openPicker}>Cambiar</button>
      <button type="button" className="image-picker-remove" aria-label="Quitar imagen" onClick={() => {
        onChange("");
        requestAnimationFrame(() => triggerRef.current?.focus());
      }}><Trash2 size={17} /></button>
    </div>}
    {!open && !selected && suggested && <div className="image-picker-suggestion">
      <span><Image src={suggested.path} alt="" fill sizes="44px" /></span>
      <p>Hay una imagen con el código <strong>{suggested.code}</strong></p>
      <button type="button" onClick={() => onChange(suggested.path)}>Usar</button>
    </div>}
    {open && <div className="image-picker-popover">
      <div className="image-picker-search">
        <Search size={18} aria-hidden="true" />
        <input ref={inputRef} role="combobox" aria-expanded="true" aria-controls="profile-image-options"
          aria-activedescendant={options[safeActiveIndex] ? `profile-image-option-${safeActiveIndex}` : undefined}
          aria-autocomplete="list" aria-label="Buscar imagen técnica por código" autoComplete="off"
          placeholder="Escribe el código… (ej. 2248)" value={query} onChange={(event) => {
            setQuery(event.target.value); setActiveIndex(0);
          }} onKeyDown={onSearchKeyDown} />
        <small>{options.length} {options.length === 1 ? "resultado" : "resultados"}</small>
      </div>
      {options.length ? <div className="image-picker-options" id="profile-image-options" role="listbox" aria-label="Imágenes técnicas">
        {options.map((option, index) => <button type="button" role="option" id={`profile-image-option-${index}`} key={option.path}
          aria-selected={option.path === value} className={index === safeActiveIndex ? "is-active" : ""} onMouseEnter={() => setActiveIndex(index)}
          onClick={() => choose(option.path)}>
          <span className="image-picker-option-image"><Image src={option.path} alt="" fill sizes="84px" /></span>
          <strong>{option.code}</strong>{option.path === value && <span className="image-picker-check"><Check size={12} /></span>}
        </button>)}
      </div> : <p className="image-picker-empty">Ninguna imagen coincide con “{query}”.</p>}
      <div className="image-picker-footer"><span>↑ ↓ ← → para moverte · Enter para elegir · Esc para cerrar</span>
        <button type="button" onClick={() => close()}>Cerrar</button></div>
    </div>}
  </div>;
}
