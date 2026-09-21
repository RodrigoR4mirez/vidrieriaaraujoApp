"use client";
import { useHydrated } from "./use-hydrated";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { PriceInput } from "./price-input";
import { Plus, Pencil, Eye, EyeOff, Search, SlidersHorizontal, X } from "lucide-react";
import {
  type CatalogState,
  type Product,
  type ProductInput,
  type BaseValue,
  type Category,
  productInputSchema,
  productDetails,
} from "@/domain/catalogs/models";
import { saveProductAction } from "@/app/actions";
import { money } from "@/lib/formatting";
import { Button, Dialog, EmptyState, Notice, StatusBadge } from "./ui";
export function GlassCatalog({ catalog }: { catalog: CatalogState }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [family, setFamily] = useState("");
  const [color, setColor] = useState("");
  const [thickness, setThickness] = useState("");
  const [editing, setEditing] = useState<Product | null | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = [family, color, thickness].filter(Boolean).length + (status === "ALL" ? 0 : 1);
  const [selectedId, setSelectedId] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const products = catalog.products.filter(
    (p) =>
      (status === "ALL" || p.status === status) &&
      (!family || p.familyId === family) &&
      (!color || p.colorFinishId === color) &&
      (!thickness || p.thicknessId === thickness) &&
      `${p.code} ${productDetails(p, catalog.values).productDescription}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selected = products.find((p) => p.id === selectedId) || products[0];
  const openDetail = (id: string) => { setSelectedId(id); setSheetOpen(true); };
  const toggleStatus = (p: Product) => startTransition(async () => {
    const result = await saveProductAction(
      { ...p, status: p.status === "ACTIVE" ? "HIDDEN" : "ACTIVE" },
      { id: p.id, revision: p.revision },
    );
    if (!result.ok) setError(result.error);
    else {
      setError("");
      router.refresh();
    }
  });
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setSheetOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);
  return (
    <div className="profile-catalog-layout">
    <section className="panel glass profile-catalog-list">
      <div className="toolbar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Buscar vidrios"
            placeholder="Buscar por código, nombre o color…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="icon-button filters-toggle"
          aria-label="Filtros"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <SlidersHorizontal size={18} />
          {activeFilters > 0 && <span className="filters-count">{activeFilters}</span>}
        </button>
        <div className={`toolbar-filters ${filtersOpen ? "is-open" : ""}`}>
        {[
          {
            label: "Familia",
            category: "families",
            value: family,
            setter: setFamily,
          },
          {
            label: "Color / acabado",
            category: "colors-finishes",
            value: color,
            setter: setColor,
          },
          {
            label: "Espesor",
            category: "thicknesses",
            value: thickness,
            setter: setThickness,
          },
        ].map((filter) => (
          <select
            key={filter.category}
            aria-label={`Filtrar ${filter.label}`}
            value={filter.value}
            onChange={(e) => filter.setter(e.target.value)}
          >
            <option value="">{filter.label}: todos</option>
            {catalog.values
              .filter((v) => v.category === filter.category)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
          </select>
        ))}
        <select
          aria-label="Filtrar estado"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="HIDDEN">Ocultos</option>
        </select>
        </div>
        <Button aria-label="Nuevo vidrio" onClick={() => setEditing(null)}>
          <Plus size={18} />
          <span className="button-label">Nuevo vidrio</span>
        </Button>
      </div>
      {error && <Notice error>{error}</Notice>}
      {products.length ? (
        <div className="table-scroll">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Vidrio</th>
                <th>Pie²</th>
                <th>Plancha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const detail = productDetails(p, catalog.values);
                return (
                  <tr
                    key={p.id}
                    onClick={() => openDetail(p.id)}
                    className={`${selected?.id === p.id ? "selected-row" : ""} ${p.status === "HIDDEN" ? "is-hidden" : ""}`}
                  >
                    <td className="cell-code">
                      <strong>{p.code}</strong>
                    </td>
                    <td className="cell-desc">
                      {[detail.family, detail.colorFinish, detail.thickness]
                        .filter(Boolean)
                        .join(" · ")}
                      <small>{detail.cathedralDesign}</small>
                    </td>
                    <td className="numeric cell-price">
                      {money(p.pricePerSquareFoot)}
                      <small className="mobile-unit">pie²</small>
                    </td>
                    <td className="numeric cell-sheet">
                      {money(p.pricePerSheet || "0.00")}
                      <small>
                        {p.sheetWidthCm
                          ? `${p.sheetWidthCm} × ${p.sheetHeightCm} cm`
                          : "—"}
                      </small>
                    </td>
                    <td className="cell-status">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="cell-actions">
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Editar ${p.code}`}
                          onClick={(event) => { event.stopPropagation(); setEditing(p); }}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-button"
                          disabled={pending}
                          aria-label={`${p.status === "ACTIVE" ? "Ocultar" : "Reactivar"} ${p.code}`}
                          onClick={(event) => { event.stopPropagation(); toggleStatus(p); }}
                        >
                          {p.status === "ACTIVE" ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="cell-chevron" aria-hidden="true">›</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Tu catálogo de vidrios">
          Crea las familias y espesores en Catálogos base; luego agrega tus
          vidrios y precios.
        </EmptyState>
      )}
      <Notice>
        Los vidrios ocultos se conservan para edición e historial.
      </Notice>
      </section>
      {sheetOpen && selected && (
        <button
          type="button"
          className="sheet-scrim"
          aria-label="Cerrar detalle"
          onClick={() => setSheetOpen(false)}
        />
      )}
      {selected && (() => {
        const detail = productDetails(selected, catalog.values);
        return (
          <aside className={`panel glass profile-detail ${sheetOpen ? "is-open" : ""}`} aria-label="Detalle del vidrio">
            <span className="sheet-handle" aria-hidden="true" />
            <div className="profile-detail-heading">
              <h2>Detalle del vidrio</h2>
              <button
                type="button"
                className="icon-button sheet-close"
                aria-label="Cerrar detalle"
                onClick={() => setSheetOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <span className="eyebrow">Código</span>
            <strong className="profile-code">{selected.code}</strong>
            <p>
              {[detail.family, detail.colorFinish, detail.thickness].filter(Boolean).join(" · ")}
              {detail.cathedralDesign ? ` · ${detail.cathedralDesign}` : ""}
            </p>
            <dl>
              <div><dt>Familia</dt><dd>{detail.family || "—"}</dd></div>
              <div><dt>Color / acabado</dt><dd>{detail.colorFinish || "—"}</dd></div>
              <div><dt>Espesor</dt><dd>{detail.thickness || "—"}</dd></div>
              <div><dt>Diseño catedral</dt><dd>{detail.cathedralDesign || "—"}</dd></div>
              <div>
                <dt>Plancha</dt>
                <dd>{selected.sheetWidthCm ? `${selected.sheetWidthCm} × ${selected.sheetHeightCm} cm` : "—"}</dd>
              </div>
              <div><dt>Estado</dt><dd><StatusBadge status={selected.status} /></dd></div>
            </dl>
            <h3>Precio</h3>
            <div className="profile-price"><span>Por pie²</span><strong>{money(selected.pricePerSquareFoot)}</strong></div>
            <div className="profile-price"><span>Por plancha</span><strong>{money(selected.pricePerSheet || "0.00")}</strong></div>
            <div className="profile-detail-actions">
              <button
                type="button"
                className="icon-button"
                disabled={pending}
                aria-label={`${selected.status === "ACTIVE" ? "Ocultar" : "Reactivar"} ${selected.code}`}
                onClick={() => toggleStatus(selected)}
              >
                {selected.status === "ACTIVE" ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
              <Button variant="secondary" onClick={() => setEditing(selected)}>
                <Pencil size={17} />
                Editar vidrio
              </Button>
            </div>
          </aside>
        );
      })()}
      {editing !== undefined && (
        <Dialog
          title={editing ? "Editar vidrio" : "Nuevo vidrio"}
          onClose={() => setEditing(undefined)}
        >
          <ProductForm
            values={catalog.values}
            editing={editing}
            onSaved={() => {
              setEditing(undefined);
              router.refresh();
            }}
            onCancel={() => setEditing(undefined)}
          />
        </Dialog>
      )}
    </div>
  );
}
function ProductForm({
  values,
  editing,
  onSaved,
  onCancel,
}: {
  values: BaseValue[];
  editing: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProductInput>({
    defaultValues: editing || {
      code: "",
      familyId: "",
      thicknessId: "",
      colorFinishId: "",
      cathedralDesignId: "",
      pricePerSquareFoot: "0.00",
      sheetWidthCm: "",
      sheetHeightCm: "",
      pricePerSheet: "0.00",
      status: "ACTIVE",
    },
  });
  const selectors: {
    field: "familyId" | "colorFinishId" | "thicknessId" | "cathedralDesignId";
    label: string;
    category: Category;
    required: boolean;
  }[] = [
    {
      field: "familyId",
      label: "Familia",
      category: "families",
      required: true,
    },
    {
      field: "colorFinishId",
      label: "Color / acabado",
      category: "colors-finishes",
      required: false,
    },
    {
      field: "thicknessId",
      label: "Espesor",
      category: "thicknesses",
      required: true,
    },
    {
      field: "cathedralDesignId",
      label: "Diseño catedral",
      category: "cathedral-designs",
      required: false,
    },
  ];
  return (
    <form
      className="form-stack"
      onSubmit={handleSubmit(async (data) => {
        const valid = productInputSchema.safeParse(data);
        if (!valid.success) {
          setError(valid.error.issues[0].message);
          return;
        }
        const result = await saveProductAction(valid.data, {
          id: editing?.id,
          revision: editing?.revision,
        });
        if (!result.ok) setError(result.error);
        else onSaved();
      })}
    >
      <div className="field">
        <label htmlFor="product-code">Código / SKU *</label>
        <input
          id="product-code"
          required
          maxLength={40}
          {...register("code")}
        />
      </div>
      <div className="form-grid">
        {selectors.map((s) => (
          <div className="field" key={s.field}>
            <label htmlFor={s.field}>
              {s.label}
              {s.required ? " *" : ""}
            </label>
            <select id={s.field} required={s.required} {...register(s.field)}>
              <option value="">
                {s.required ? "Seleccionar…" : "Sin especificar"}
              </option>
              {values
                .filter(
                  (v) =>
                    v.category === s.category &&
                    (v.status === "ACTIVE" || editing?.[s.field] === v.id),
                )
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.status === "HIDDEN" ? " (Oculto)" : ""}
                  </option>
                ))}
            </select>
          </div>
        ))}
      </div>
      <div className="form-grid">
        {[
          {
            field: "sheetWidthCm",
            label: "Ancho de plancha (cm)",
            required: false,
          },
          {
            field: "sheetHeightCm",
            label: "Alto de plancha (cm)",
            required: false,
          },
          {
            field: "pricePerSquareFoot",
            label: "Precio por pie² (S/)",
            required: false,
          },
          {
            field: "pricePerSheet",
            label: "Precio por plancha (S/)",
            required: false,
          },
        ].map((s) => (
          <div className="field" key={s.field}>
            <label htmlFor={s.field}>
              {s.label}
              {s.required ? " *" : ""}
            </label>
            {s.field === "pricePerSquareFoot" || s.field === "pricePerSheet" ? (
              <Controller
                name={s.field}
                control={control}
                render={({ field }) => (
                  <PriceInput
                    id={s.field}
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    inputRef={field.ref}
                    required={s.required}
                  />
                )}
              />
            ) : <input
              id={s.field}
              inputMode="decimal"
              type="number"
              min="0.000001"
              step="any"
              required={s.required}
              {...register(s.field as keyof ProductInput)}
            />}
          </div>
        ))}
      </div>
      <div className="field">
        <label htmlFor="product-status">Estado</label>
        <select id="product-status" {...register("status")}>
          <option value="ACTIVE">Activo</option>
          <option value="HIDDEN">Oculto</option>
        </select>
      </div>
      {error && <Notice error>{error}</Notice>}
      <div className="form-actions">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={isSubmitting || !hydrated}>
          {isSubmitting ? "Guardando…" : "Guardar vidrio"}
        </Button>
      </div>
    </form>
  );
}
