"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Eye, EyeOff, PackageOpen, Pencil, Plus, Search, Upload, X } from "lucide-react";
import {
  aluminumProfileInputSchema,
  type AluminumCatalog,
  type AluminumProfile,
  type AluminumProfileInput,
} from "@/domain/aluminum/models";
import {
  saveAluminumProfileAction,
  seedAluminumCatalogAction,
} from "@/app/actions";
import { money } from "@/lib/formatting";
import { Button, Dialog, EmptyState, Notice, StatusBadge } from "./ui";
import { PriceInput } from "./price-input";
import { useHydrated } from "./use-hydrated";

export function AluminumProfileCatalog({ catalog }: { catalog: AluminumCatalog }) {
  const [query, setQuery] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AluminumProfile | null | undefined>();
  const [selectedId, setSelectedId] = useState(catalog.profiles[0]?.id || "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const profiles = useMemo(() => catalog.profiles.filter((profile) =>
    (!familyId || profile.familyId === familyId) &&
    (status === "ALL" || profile.status === status) &&
    `${profile.code} ${profile.description}`.toLocaleLowerCase("es-PE")
      .includes(query.toLocaleLowerCase("es-PE")),
  ), [catalog.profiles, familyId, query, status]);
  const selected = profiles.find((profile) => profile.id === selectedId) || profiles[0];
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(profiles.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleProfiles = profiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const familyName = (id: string) => catalog.families.find((family) => family.id === id)?.name || "—";
  const openDetail = (id: string) => { setSelectedId(id); setSheetOpen(true); };
  const toggleStatus = (profile: AluminumProfile) => startTransition(async () => {
    const result = await saveAluminumProfileAction({ ...profile,
      status: profile.status === "ACTIVE" ? "HIDDEN" : "ACTIVE",
    }, { id: profile.id, revision: profile.revision });
    if (!result.ok) setError(result.error); else router.refresh();
  });
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setSheetOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  return <div className="profile-catalog-layout">
    <section className="panel glass profile-catalog-list">
      <div className="toolbar">
        <div className="search-field"><Search size={18} /><input aria-label="Buscar perfiles"
          placeholder="Buscar por código o descripción…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div>
        <select aria-label="Filtrar familia" value={familyId} onChange={(event) => { setFamilyId(event.target.value); setPage(1); }}>
          <option value="">Todas las familias</option>
          {catalog.families.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
        </select>
        <select aria-label="Filtrar estado" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="ALL">Todos</option><option value="ACTIVE">Activos</option><option value="HIDDEN">Ocultos</option>
        </select>
        <Button aria-label="Nuevo perfil" onClick={() => setEditing(null)}><Plus size={18} /><span className="button-label">Nuevo perfil</span></Button>
      </div>
      {error && <Notice error>{error}</Notice>}
      {!catalog.profiles.length ? <EmptyState title="Carga el catálogo de perfiles">
        <p>Importa la carga versionada obtenida de `lista - Rodri.xlsx`: 21 familias, 2 colores y 143 perfiles únicos.</p>
        <Button disabled={pending} onClick={() => startTransition(async () => {
          const result = await seedAluminumCatalogAction();
          if (!result.ok) setError(result.error);
          else router.refresh();
        })}><Upload size={18} />{pending ? "Cargando…" : "Cargar referencia inicial"}</Button>
      </EmptyState> : profiles.length ? <div className="table-scroll"><table>
        <thead><tr><th>Imagen</th><th>Código</th><th>Descripción</th><th>Familia</th><th>Colores</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>{visibleProfiles.map((profile) => <tr key={profile.id} onClick={() => openDetail(profile.id)}
          className={`${selected?.id === profile.id ? "selected-row" : ""} ${profile.status === "HIDDEN" ? "is-hidden" : ""}`}>
          <td className="cell-image"><ProfileImage profile={profile} size={54} /></td>
          <td className="cell-code"><button className="profile-select-button" aria-pressed={selected?.id === profile.id}
            onClick={(event) => { event.stopPropagation(); openDetail(profile.id); }}><strong>{profile.code}</strong></button></td>
          <td className="cell-desc">{profile.description}</td><td className="cell-family">{familyName(profile.familyId)}</td>
          <td className="cell-colors"><div className="swatch-stack">{profile.colorPrices.map((price) => {
            const color = catalog.colors.find((entry) => entry.id === price.colorId);
            return color ? <span key={color.id} title={`${color.name}: ${money(price.pricePerBar)}`}
              className="color-swatch" style={{ backgroundColor: color.swatch }} /> : null;
          })}</div></td>
          <td className="cell-status"><StatusBadge status={profile.status} /></td>
          <td className="cell-actions"><div className="row-actions">
            <button className="icon-button" aria-label={`Editar ${profile.code}`} onClick={(event) => {
              event.stopPropagation(); setEditing(profile);
            }}><Pencil size={17} /></button>
            <button className="icon-button" disabled={pending}
              aria-label={`${profile.status === "ACTIVE" ? "Ocultar" : "Reactivar"} ${profile.code}`}
              onClick={(event) => { event.stopPropagation(); toggleStatus(profile); }}>{profile.status === "ACTIVE" ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div></td>
          <td className="cell-chevron" aria-hidden="true"><ChevronRight size={18} /></td>
        </tr>)}</tbody>
      </table></div> : <EmptyState title="No hay perfiles para mostrar">Ajusta la búsqueda o los filtros.</EmptyState>}
      {!!profiles.length && <div className="catalog-pagination">
        <span>Mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, profiles.length)} de {profiles.length}</span>
        <div><button className="icon-button" disabled={currentPage === 1} aria-label="Página anterior"
          onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>
          <strong>{currentPage} / {pageCount}</strong>
          <button className="icon-button" disabled={currentPage === pageCount} aria-label="Página siguiente"
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>›</button></div>
      </div>}
      <Notice>Los perfiles ocultos no aparecen en nuevas cotizaciones y permanecen en históricos.</Notice>
    </section>
    {sheetOpen && selected && <button type="button" className="sheet-scrim" aria-label="Cerrar detalle"
      onClick={() => setSheetOpen(false)} />}
    {selected && <aside className={`panel glass profile-detail ${sheetOpen ? "is-open" : ""}`} aria-label="Detalle del perfil">
      <span className="sheet-handle" aria-hidden="true" />
      <div className="profile-detail-heading"><h2>Detalle del perfil</h2>
        <button type="button" className="icon-button sheet-close" aria-label="Cerrar detalle"
          onClick={() => setSheetOpen(false)}><X size={18} /></button></div><ProfileImage profile={selected} size={240} />
      <span className="eyebrow">Código</span><strong className="profile-code">{selected.code}</strong>
      <p>{selected.description}</p>
      <dl><div><dt>Familia</dt><dd>{familyName(selected.familyId)}</dd></div>
        <div><dt>Barra comercial</dt><dd>{selected.barLengthMeters} metros</dd></div></dl>
      <h3>Precio por color</h3>
      {selected.colorPrices.map((price) => {
        const color = catalog.colors.find((entry) => entry.id === price.colorId);
        return <div className="profile-price" key={price.colorId}><span><span className="color-swatch"
          style={{ backgroundColor: color?.swatch }} />{color?.name || "Color"}</span><strong>{money(price.pricePerBar)}</strong></div>;
      })}
      <div className="profile-detail-actions">
        <button type="button" className="icon-button" disabled={pending}
          aria-label={`${selected.status === "ACTIVE" ? "Ocultar" : "Reactivar"} ${selected.code}`}
          onClick={() => toggleStatus(selected)}>{selected.status === "ACTIVE" ? <EyeOff size={17} /> : <Eye size={17} />}</button>
        <Button variant="secondary" onClick={() => setEditing(selected)}><Pencil size={17} />Editar perfil</Button>
      </div>
    </aside>}
    {editing !== undefined && <Dialog title={editing ? "Editar perfil" : "Nuevo perfil"} onClose={() => setEditing(undefined)}>
      <ProfileForm catalog={catalog} editing={editing} onCancel={() => setEditing(undefined)} onSaved={() => {
        setEditing(undefined); router.refresh();
      }} />
    </Dialog>}
  </div>;
}

function ProfileImage({ profile, size }: { profile: AluminumProfile; size: number }) {
  return <span className="profile-image" style={{ width: size, height: Math.max(46, Math.round(size * .62)) }}>
    {profile.imagePath ? <Image src={profile.imagePath} alt={`Sección técnica de ${profile.code}`} fill sizes={`${size}px`} />
      : <PackageOpen size={Math.min(34, size / 2)} />}
  </span>;
}

function ProfileForm({ catalog, editing, onSaved, onCancel }: {
  catalog: AluminumCatalog; editing: AluminumProfile | null; onSaved: () => void; onCancel: () => void;
}) {
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: editing?.code || "", description: editing?.description || "", familyId: editing?.familyId || "",
    barLengthMeters: editing?.barLengthMeters || "6.00", imagePath: editing?.imagePath || "", status: editing?.status || "ACTIVE" as const,
  });
  const [prices, setPrices] = useState<Record<string, string>>(() => Object.fromEntries(
    editing?.colorPrices.map((entry) => [entry.colorId, entry.pricePerBar]) || [],
  ));
  return <form className="form-stack" onSubmit={(event) => {
    event.preventDefault();
    const candidate: AluminumProfileInput = {
      ...form,
      colorPrices: Object.entries(prices).filter(([, price]) => price && Number(price) > 0)
        .map(([colorId, pricePerBar]) => ({ colorId, pricePerBar })),
    };
    const valid = aluminumProfileInputSchema.safeParse(candidate);
    if (!valid.success) { setError(valid.error.issues[0]?.message || "Revisa los campos."); return; }
    startTransition(async () => {
      const result = await saveAluminumProfileAction(valid.data, { id: editing?.id, revision: editing?.revision });
      if (!result.ok) setError(result.error); else onSaved();
    });
  }}>
    <div className="form-grid"><div className="field"><label htmlFor="profile-code">Código *</label>
      <input id="profile-code" required maxLength={40} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /></div>
      <div className="field"><label htmlFor="profile-family-form">Familia *</label><select id="profile-family-form" required
        value={form.familyId} onChange={(event) => setForm({ ...form, familyId: event.target.value })}>
        <option value="">Selecciona…</option>{catalog.families.filter((family) => family.status === "ACTIVE" || family.id === editing?.familyId)
          .map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}</select></div></div>
    <div className="field"><label htmlFor="profile-description">Descripción *</label><input id="profile-description" required maxLength={240}
      value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
    <div className="form-grid"><div className="field"><label htmlFor="profile-length">Longitud de barra (m) *</label><PriceInput id="profile-length"
      value={form.barLengthMeters} onChange={(value) => setForm({ ...form, barLengthMeters: value })} /></div>
      <div className="field"><label htmlFor="profile-status">Estado</label><select id="profile-status" value={form.status}
        onChange={(event) => setForm({ ...form, status: event.target.value as "ACTIVE" | "HIDDEN" })}>
        <option value="ACTIVE">Activo</option><option value="HIDDEN">Oculto</option></select></div></div>
    <div className="field"><label htmlFor="profile-image-path">Imagen técnica</label><select id="profile-image-path" value={form.imagePath}
      onChange={(event) => setForm({ ...form, imagePath: event.target.value })}><option value="">Sin imagen de origen</option>
      {Array.from({ length: 49 }, (_, index) => `/profiles/image${index + 1}.png`).map((path) => <option value={path} key={path}>{path}</option>)}</select></div>
    <fieldset className="profile-price-editor"><legend>Precios por barra y color *</legend>
      {catalog.colors.filter((color) => color.status === "ACTIVE" || prices[color.id]).map((color) => <label key={color.id}>
        <input type="checkbox" checked={Boolean(prices[color.id])} onChange={(event) => setPrices((old) => ({ ...old,
          [color.id]: event.target.checked ? old[color.id] || "0.00" : "",
        }))} /><span className="color-swatch" style={{ backgroundColor: color.swatch }} />{color.name}
        {prices[color.id] !== undefined && prices[color.id] !== "" && <PriceInput id={`profile-color-${color.id}`} aria-label={`Precio ${color.name}`}
          value={prices[color.id]} onChange={(value) => setPrices((old) => ({ ...old, [color.id]: value }))} />}
      </label>)}
    </fieldset>
    {error && <Notice error>{error}</Notice>}
    <div className="form-actions"><Button variant="secondary" type="button" onClick={onCancel}>Cancelar</Button>
      <Button disabled={!hydrated || pending}>{pending ? "Guardando…" : "Guardar perfil"}</Button></div>
  </form>;
}
