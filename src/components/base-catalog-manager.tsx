"use client";
import { useHydrated } from "./use-hydrated";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Pencil, Eye, EyeOff, Layers, Search, Save } from "lucide-react";
import {
  type BaseValue,
  type BaseInput,
  type Category,
  categoryLabels,
  baseInputSchema,
} from "@/domain/catalogs/models";
import { saveBaseAction } from "@/app/actions";
import { Button, EmptyState, Notice, StatusBadge } from "./ui";
export function BaseCatalogManager({ values }: { values: BaseValue[] }) {
  const [category, setCategory] = useState<Category>("families");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [editing, setEditing] = useState<BaseValue | null>(null);
  const [generation, setGeneration] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const reset = () => {
    setEditing(null);
    setGeneration((n) => n + 1);
  };
  const filtered = values.filter(
    (v) =>
      v.category === category &&
      (status === "ALL" || v.status === status) &&
      `${v.code} ${v.name}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="base-layout">
      <aside className="panel glass category-rail">
        <h2>
          <Layers size={20} /> Tipos de catálogo
        </h2>
        <p className="muted">Selecciona las opciones que deseas administrar.</p>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            className={category === key ? "category selected" : "category"}
            onClick={() => {
              setCategory(key as Category);
              reset();
            }}
          >
            <span>{label}</span>
            <span className="count">
              {values.filter((v) => v.category === key).length}
            </span>
          </button>
        ))}
      </aside>
      <section className="panel glass base-list">
        <div className="section-heading">
          <div>
            <h2>Listado del catálogo</h2>
            <p className="muted">{categoryLabels[category]}</p>
          </div>
        </div>
        <div className="toolbar">
          <div className="search-field">
            <Search size={18} />
            <input
              aria-label="Buscar catálogo base"
              placeholder="Buscar por código o nombre…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Filtrar estado"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="HIDDEN">Ocultos</option>
          </select>
        </div>
        {error && <Notice error>{error}</Notice>}
        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre / descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <strong>{v.code}</strong>
                    </td>
                    <td>
                      {v.name}
                      <small>{v.description}</small>
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Editar ${v.code}`}
                          onClick={() => {
                            setEditing(v);
                            setGeneration((n) => n + 1);
                          }}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-button"
                          disabled={pending}
                          aria-label={`${v.status === "ACTIVE" ? "Ocultar" : "Reactivar"} ${v.code}`}
                          onClick={() =>
                            startTransition(async () => {
                              const result = await saveBaseAction(
                                {
                                  ...v,
                                  status:
                                    v.status === "ACTIVE" ? "HIDDEN" : "ACTIVE",
                                },
                                { id: v.id, revision: v.revision },
                              );
                              if (!result.ok) setError(result.error);
                              else {
                                setError("");
                                router.refresh();
                              }
                            })
                          }
                        >
                          {v.status === "ACTIVE" ? (
                            <EyeOff size={17} />
                          ) : (
                            <Eye size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No hay valores para mostrar">
            Crea el primer valor o ajusta los filtros.
          </EmptyState>
        )}
        <Notice>
          Los valores ocultos se conservan para edición e historial y no
          aparecen en nuevas cotizaciones.
        </Notice>
      </section>
      <BaseCatalogForm
        key={`${category}-${generation}`}
        category={category}
        editing={editing}
        onSaved={() => {
          reset();
          router.refresh();
        }}
        onCancel={reset}
      />
    </div>
  );
}
function BaseCatalogForm({
  category,
  editing,
  onSaved,
  onCancel,
}: {
  category: Category;
  editing: BaseValue | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<BaseInput>({
    defaultValues: editing || {
      category,
      code: "",
      name: "",
      description: "",
      observation: "",
      status: "ACTIVE",
    },
  });
  return (
    <section className="panel glass base-form">
      <h2>{editing ? "Editar valor" : "Nuevo valor"}</h2>
      <p className="muted">{categoryLabels[category]}</p>
      <form
        className="form-stack"
        onSubmit={handleSubmit(async (data) => {
          const valid = baseInputSchema.safeParse(data);
          if (!valid.success) {
            setError(valid.error.issues[0].message);
            return;
          }
          const result = await saveBaseAction(valid.data, {
            id: editing?.id,
            revision: editing?.revision,
          });
          if (!result.ok) setError(result.error);
          else onSaved();
        })}
      >
        <div className="field">
          <label htmlFor="base-code">Código *</label>
          <input id="base-code" required maxLength={40} {...register("code")} />
        </div>
        <div className="field">
          <label htmlFor="base-name">Nombre *</label>
          <input
            id="base-name"
            required
            maxLength={100}
            {...register("name")}
          />
        </div>
        <div className="field">
          <label htmlFor="base-description">Descripción</label>
          <input
            id="base-description"
            maxLength={300}
            {...register("description")}
          />
        </div>
        <div className="field">
          <label htmlFor="base-status">Estado</label>
          <select id="base-status" {...register("status")}>
            <option value="ACTIVE">Activo</option>
            <option value="HIDDEN">Oculto</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="base-note">Observación (opcional)</label>
          <textarea
            id="base-note"
            rows={3}
            maxLength={200}
            {...register("observation")}
          />
        </div>
        {error && <Notice error>{error}</Notice>}
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={isSubmitting || !hydrated}>
            <Save size={16} />
            {isSubmitting ? "Guardando…" : "Guardar cambio"}
          </Button>
        </div>
      </form>
    </section>
  );
}
