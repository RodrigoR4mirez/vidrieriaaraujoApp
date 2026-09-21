"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Palette, Pencil, Save, Search, Shapes } from "lucide-react";
import {
  aluminumColorInputSchema,
  aluminumFamilyInputSchema,
  type AluminumCatalog,
  type AluminumColor,
  type AluminumFamily,
} from "@/domain/aluminum/models";
import { saveAluminumColorAction, saveAluminumFamilyAction } from "@/app/actions";
import { Button, EmptyState, Notice, StatusBadge } from "./ui";
import { useHydrated } from "./use-hydrated";

type Category = "FAMILIES" | "COLORS";
type Editable = AluminumFamily | AluminumColor;

export function AluminumBaseCatalogManager({ catalog }: { catalog: AluminumCatalog }) {
  const [category, setCategory] = useState<Category>("FAMILIES");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editable | null>(null);
  const [generation, setGeneration] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const records = category === "FAMILIES" ? catalog.families : catalog.colors;
  const filtered = records.filter((record) => record.name.toLocaleLowerCase("es-PE").includes(query.toLocaleLowerCase("es-PE")));
  const reset = () => { setEditing(null); setGeneration((value) => value + 1); };
  return <div className="base-layout">
    <aside className="panel glass category-rail"><h2><Shapes size={20} />Tipos de catálogo</h2>
      <p className="muted">Información base para cotizar perfiles.</p>
      <button className={category === "FAMILIES" ? "category selected" : "category"}
        onClick={() => { setCategory("FAMILIES"); reset(); }}><span>Familias</span><span className="count">{catalog.families.length}</span></button>
      <button className={category === "COLORS" ? "category selected" : "category"}
        onClick={() => { setCategory("COLORS"); reset(); }}><span>Colores</span><span className="count">{catalog.colors.length}</span></button>
      <Link className="category" href="/perfiles"><span>Perfiles y códigos</span><span className="count">{catalog.profiles.length}</span></Link>
    </aside>
    <section className="panel glass base-list"><div className="section-heading"><div><h2>Listado del catálogo</h2>
      <p className="muted">{category === "FAMILIES" ? "Familias de perfiles" : "Colores de aluminio"}</p></div></div>
      <div className="toolbar"><div className="search-field"><Search size={18} /><input aria-label="Buscar catálogo de perfiles"
        placeholder="Buscar por nombre…" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
      {error && <Notice error>{error}</Notice>}
      {filtered.length ? <div className="table-scroll"><table><thead><tr><th>Nombre</th>
        {category === "COLORS" && <th>Muestra</th>}<th>Estado</th><th>Acciones</th></tr></thead><tbody>
        {filtered.map((record) => <tr key={record.id}><td><strong>{record.name}</strong>
          {"description" in record && <small>{record.description}</small>}</td>
          {category === "COLORS" && <td><span className="color-swatch" style={{ backgroundColor: "swatch" in record ? record.swatch : "#ccc" }} /></td>}
          <td><StatusBadge status={record.status} /></td><td><div className="row-actions">
            <button className="icon-button" aria-label={`Editar ${record.name}`} onClick={() => { setEditing(record); setGeneration((value) => value + 1); }}><Pencil size={17} /></button>
            <button className="icon-button" disabled={pending} aria-label={`${record.status === "ACTIVE" ? "Ocultar" : "Reactivar"} ${record.name}`}
              onClick={() => startTransition(async () => {
                const input = { ...record, status: record.status === "ACTIVE" ? "HIDDEN" as const : "ACTIVE" as const };
                const result = category === "FAMILIES"
                  ? await saveAluminumFamilyAction(input, { id: record.id, revision: record.revision })
                  : await saveAluminumColorAction(input, { id: record.id, revision: record.revision });
                if (!result.ok) setError(result.error); else router.refresh();
              })}>{record.status === "ACTIVE" ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div></td></tr>)}</tbody></table></div> : <EmptyState title="No hay valores para mostrar">Crea el primer valor o ajusta la búsqueda.</EmptyState>}
      <Notice>Los valores ocultos se conservan y no están disponibles en nuevas cotizaciones.</Notice>
    </section>
    <AluminumBaseForm key={`${category}-${generation}`} category={category} editing={editing} onCancel={reset}
      onSaved={() => { reset(); router.refresh(); }} />
  </div>;
}

function AluminumBaseForm({ category, editing, onSaved, onCancel }: {
  category: Category; editing: Editable | null; onSaved: () => void; onCancel: () => void;
}) {
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing && "description" in editing ? editing.description : "");
  const [swatch, setSwatch] = useState(editing && "swatch" in editing ? editing.swatch : "#C4C9CF");
  const [status, setStatus] = useState<"ACTIVE" | "HIDDEN">(editing?.status || "ACTIVE");
  return <section className="panel glass base-form"><h2>{editing ? "Editar" : "Nuevo"} {category === "FAMILIES" ? "familia" : "color"}</h2>
    <p className="muted">Los cambios se aplican a los perfiles disponibles.</p>
    <form className="form-stack" onSubmit={(event) => {
      event.preventDefault();
      const parsed = category === "FAMILIES"
        ? aluminumFamilyInputSchema.safeParse({ name, description, status })
        : aluminumColorInputSchema.safeParse({ name, swatch, status });
      if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Revisa los campos."); return; }
      startTransition(async () => {
        const result = category === "FAMILIES"
          ? await saveAluminumFamilyAction(parsed.data, { id: editing?.id, revision: editing?.revision })
          : await saveAluminumColorAction(parsed.data, { id: editing?.id, revision: editing?.revision });
        if (!result.ok) setError(result.error); else onSaved();
      });
    }}>
      <div className="field"><label htmlFor="aluminum-base-name">Nombre *</label><input id="aluminum-base-name" required maxLength={120}
        value={name} onChange={(event) => setName(event.target.value)} /></div>
      {category === "FAMILIES" ? <div className="field"><label htmlFor="aluminum-base-description">Descripción</label><input
        id="aluminum-base-description" maxLength={300} value={description} onChange={(event) => setDescription(event.target.value)} /></div>
        : <div className="field"><label htmlFor="aluminum-color">Muestra de color</label><div className="color-input"><Palette size={18} />
          <input id="aluminum-color" type="color" value={swatch} onChange={(event) => setSwatch(event.target.value.toUpperCase())} /><code>{swatch}</code></div></div>}
      <div className="field"><label htmlFor="aluminum-base-status">Estado</label><select id="aluminum-base-status" value={status}
        onChange={(event) => setStatus(event.target.value as "ACTIVE" | "HIDDEN")}><option value="ACTIVE">Activo</option><option value="HIDDEN">Oculto</option></select></div>
      {error && <Notice error>{error}</Notice>}
      <div className="form-actions"><Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button disabled={!hydrated || pending}><Save size={16} />{pending ? "Guardando…" : "Guardar cambio"}</Button></div>
    </form>
  </section>;
}
