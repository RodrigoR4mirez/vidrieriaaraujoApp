"use client";
import { useHydrated } from "./use-hydrated";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Eye, EyeOff, Search } from "lucide-react";
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
  return (
    <section className="panel glass">
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
        <Button onClick={() => setEditing(null)}>
          <Plus size={18} />
          Nuevo vidrio
        </Button>
      </div>
      {error && <Notice error>{error}</Notice>}
      {products.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Familia</th>
                <th>Color / acabado</th>
                <th>Espesor</th>
                <th>Plancha (cm)</th>
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
                  <tr key={p.id}>
                    <td>
                      <strong>{p.code}</strong>
                    </td>
                    <td>
                      {detail.family}
                      <small>{detail.cathedralDesign}</small>
                    </td>
                    <td>{detail.colorFinish || "—"}</td>
                    <td>{detail.thickness}</td>
                    <td>
                      {p.sheetWidthCm
                        ? `${p.sheetWidthCm} × ${p.sheetHeightCm}`
                        : "—"}
                    </td>
                    <td className="numeric">{money(p.pricePerSquareFoot)}</td>
                    <td className="numeric">
                      {p.pricePerSheet ? money(p.pricePerSheet) : "—"}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Editar ${p.code}`}
                          onClick={() => setEditing(p)}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-button"
                          disabled={pending}
                          aria-label={`${p.status === "ACTIVE" ? "Ocultar" : "Reactivar"} ${p.code}`}
                          onClick={() =>
                            startTransition(async () => {
                              const result = await saveProductAction(
                                {
                                  ...p,
                                  status:
                                    p.status === "ACTIVE" ? "HIDDEN" : "ACTIVE",
                                },
                                { id: p.id, revision: p.revision },
                              );
                              if (!result.ok) setError(result.error);
                              else {
                                setError("");
                                router.refresh();
                              }
                            })
                          }
                        >
                          {p.status === "ACTIVE" ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </div>
                    </td>
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
    </section>
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
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProductInput>({
    defaultValues: editing || {
      code: "",
      familyId: "",
      thicknessId: "",
      colorFinishId: "",
      cathedralDesignId: "",
      pricePerSquareFoot: "",
      sheetWidthCm: "",
      sheetHeightCm: "",
      pricePerSheet: "",
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
            required: true,
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
            <input
              id={s.field}
              inputMode="decimal"
              type="number"
              min="0.000001"
              step="any"
              required={s.required}
              {...register(s.field as keyof ProductInput)}
            />
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
