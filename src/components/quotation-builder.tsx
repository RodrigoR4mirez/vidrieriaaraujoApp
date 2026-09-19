"use client";
import { useQuotationDraft } from "./use-quotation-draft";
import { emptyForm, type QuotationForm } from "@/lib/quotation-draft-cache";
import { useHydrated } from "./use-hydrated";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, RotateCcw, Ruler } from "lucide-react";
import {
  type CatalogState,
  type SaleMode,
  isQuotable,
} from "@/domain/catalogs/models";
import {
  draftItemSchema,
  type DraftItem,
  type QuotationItem,
} from "@/domain/quotation/models";
import { priceDraft } from "@/application/use-cases";
import { confirmAction } from "@/app/actions";
import { money } from "@/lib/formatting";
import { quotationTechnicalDetail } from "@/lib/quotation-item";
import { Button, Dialog, Notice, QuantityControl } from "./ui";
import { GlassPicker } from "./glass-picker";
import { QuotationSummary } from "./quotation-summary";
export function QuotationBuilder({ catalog, owner }: { catalog: CatalogState; owner: string }) {
  const { draft, update, clear: clearCache, warning, get } = useQuotationDraft(owner);
  const { items, editId, customerName, conditions, requestId, form } = draft;
  const hydrated = useHydrated();
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  let priced: QuotationItem[] = [];
  let pricingError = "";
  try {
    priced = priceDraft(items, catalog);
  } catch (error) {
    pricingError = error instanceof Error ? error.message : "Revisa los ítems.";
  }
  useEffect(() => {
    if (!warning || (!items.length && !customerName && !conditions && !form.mode)) return;
    const leave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [items.length, customerName, conditions, form.mode, warning]);
  const cancelEdit = () => update((old) => ({ ...old, editId: null, form: emptyForm() }));
  const clear = () => {
    clearCache();
    setError("");
    setResetOpen(false);
  };
  const remove = (id: string) => {
    update((old) => ({ ...old, items: old.items.filter((item) => item.id !== id), requestId: "",
      ...(old.editId === id ? { editId: null, form: emptyForm() } : {}),
    }));
    setError("");
  };
  return (
    <fieldset disabled={pending || !hydrated} className="quotation-layout">
      <aside className="panel glass quote-form">
        <h2>
          <Ruler size={20} />
          Agregar vidrio
        </h2>
        <p className="muted">Elige por pie² o por plancha entera.</p>
        {catalog.products.length ? (
          <ItemForm
            catalog={catalog}
            editing={items.find((i) => i.id === editId)}
            form={form}
            onFormChange={(next) => update((old) => ({ ...old, form: next }))}
            onSave={(item) => {
              update((old) => ({ ...old,
                items: old.editId ? old.items.map((i) => i.id === old.editId ? item : i) : [...old.items, item],
                editId: null, requestId: "",
                form: old.editId ? emptyForm() : { ...old.form, widthCm: "", heightCm: "", quantity: 1 },
              }));
              setError("");
            }}
            onCancel={cancelEdit}
          />
        ) : (
          <Notice>
            El catálogo está vacío.{" "}
            <Link href="/catalogos">Crea las opciones base</Link> y{" "}
            <Link href="/catalogo">agrega un vidrio</Link> para empezar.
          </Notice>
        )}
      </aside>
      <section className="panel glass quote-summary">
        <QuotationSummary
          items={priced}
          onEdit={(id) => {
            const item = items.find((i) => i.id === id);
            if (!item) return;
            update((old) => ({ ...old, editId: id, form: {
              mode: item.mode ?? "SQUARE_FOOT", productId: item.productId,
              familyId: catalog.products.find((p) => p.id === item.productId)?.familyId || "",
              quantity: item.quantity,
              widthCm: item.mode !== "SHEET" ? item.widthCm : "",
              heightCm: item.mode !== "SHEET" ? item.heightCm : "",
            } }));
          }}
          onDelete={remove}
        />
        <div className="field conditions-field">
          <label htmlFor="customer-name">Nombre del cliente *</label>
          <input
            id="customer-name"
            maxLength={160}
            required
            autoComplete="name"
            placeholder="Ej. María Pérez"
            value={customerName}
            onChange={(e) => {
              update((old) => ({ ...old, customerName: e.target.value, requestId: "" }));
              setError("");
            }}
          />
        </div>
        <div className="field conditions-field">
          <label htmlFor="conditions">Condiciones comerciales (opcional)</label>
          <textarea
            id="conditions"
            rows={2}
            maxLength={2000}
            placeholder="Indica las condiciones acordadas para esta cotización."
            value={conditions}
            onChange={(e) => {
              update((old) => ({ ...old, conditions: e.target.value, requestId: "" }));
              setError("");
            }}
          />
        </div>
        {warning && <Notice error>{warning}</Notice>}
        {pricingError && <ul className="draft-recovery">
          {items.map((item) => <li key={item.id}>
            <span>{catalog.products.find((p) => p.id === item.productId)?.code || "Vidrio no disponible"} · Cantidad: {item.quantity}</span>
            <Button variant="secondary" onClick={() => remove(item.id)}>Retirar ítem</Button>
          </li>)}
        </ul>}
        {(error || pricingError) && (
          <Notice error>{error || pricingError}</Notice>
        )}
        <div className="form-actions">
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              items.length || customerName || conditions || form.mode || form.widthCm || form.heightCm ? setResetOpen(true) : clear()
            }
          >
            <RotateCcw size={17} />
            Nueva cotización
          </Button>
          <Button
            disabled={!items.length || !!pricingError || pending || !!editId}
            onClick={() => {
              if (!customerName.trim()) {
                setError("Ingresa el nombre del cliente antes de confirmar la cotización.");
                return;
              }
              startTransition(async () => {
                const id = requestId || crypto.randomUUID();
                update((old) => ({ ...old, requestId: id }));
                const result = await confirmAction({
                  requestId: id,
                  customerName,
                  items,
                  conditions,
                });
                if (!result.ok) setError(result.error);
                else {
                  if (get().draft.requestId === id) clearCache();
                  router.push(`/cotizaciones/${result.data.number}`);
                  router.refresh();
                }
              });
            }}
          >
            {pending ? "Confirmando…" : "Confirmar cotización"}
            <ArrowRight size={18} />
          </Button>
        </div>
      </section>
      {resetOpen && (
        <Dialog
          title="¿Crear una nueva cotización?"
          onClose={() => setResetOpen(false)}
        >
          <p>
            Se descartará el borrador actual. Las cotizaciones confirmadas se
            conservan.
          </p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Seguir editando
            </Button>
            <Button onClick={clear}>Descartar borrador</Button>
          </div>
        </Dialog>
      )}
    </fieldset>
  );
}
function ItemForm({
  catalog,
  editing,
  form,
  onFormChange,
  onSave,
  onCancel,
}: {
  catalog: CatalogState;
  editing?: DraftItem;
  form: QuotationForm;
  onFormChange: (form: QuotationForm) => void;
  onSave: (item: DraftItem) => void;
  onCancel: () => void;
}) {
  const hydrated = useHydrated();
  const { mode, familyId, productId, widthCm, heightCm, quantity } = form;
  const patch = (change: Partial<QuotationForm>) => onFormChange({ ...form, ...change });
  const available = mode ? catalog.products.filter((p) => isQuotable(p, catalog.values, mode)) : [];
  const families = catalog.values.filter((v) => v.category === "families" && available.some((p) => p.familyId === v.id));
  const familyProducts = available.filter((p) => p.familyId === familyId);
  const [error, setError] = useState("");
  const product = familyProducts.find((p) => p.id === productId);
  const candidate = {
    productId: product?.id || "",
    mode,
    quantity,
    ...(mode === "SQUARE_FOOT" ? { widthCm, heightCm } : {}),
  };
  let estimate: QuotationItem | undefined;
  if (product) {
    try {
      const item = draftItemSchema.parse({ ...candidate, id: editing?.id || product.id });
      estimate = priceDraft([item], catalog)[0];
    } catch {
      /* Incomplete input has no estimate. */
    }
  }
  return (
    <form
      className="form-stack"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = draftItemSchema.safeParse({
          id: editing?.id || crypto.randomUUID(),
          ...candidate,
        });
        if (!parsed.success) {
          setError("Selecciona un vidrio disponible, una cantidad entera mayor que cero y medidas válidas cuando corresponda.");
          return;
        }
        onSave(parsed.data);
        setError("");

      }}
    >
      {editing && <Notice>{mode === "SHEET" ? "Editar cantidad de planchas" : "Editar medidas y cantidad"}</Notice>}
      <div className="field">
        <label htmlFor="sale-mode">Cotizar por</label>
        <select id="sale-mode" value={mode} disabled={!!editing} onChange={(event) => {
          onFormChange({ ...emptyForm(), mode: event.target.value as SaleMode | "" });
          setError("");
        }}>
          <option value="">Selecciona la modalidad</option>
          <option value="SQUARE_FOOT">Pie² (por medidas)</option>
          <option value="SHEET">Plancha entera</option>
        </select>
      </div>
      {mode && !available.length && <Notice>No hay vidrios activos con precio disponible para esta modalidad.</Notice>}
      <div className="field">
        <label htmlFor="family-select">Familia</label>
        <select id="family-select" value={familyId} disabled={!!editing || !mode || !families.length}
          onChange={(event) => { onFormChange({ ...emptyForm(), mode, familyId: event.target.value }); setError(""); }} required>
          <option value="">Selecciona la familia</option>
          {families.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
        </select>
      </div>
      <GlassPicker key={`${mode}-${familyId}`} products={familyProducts} values={catalog.values}
        value={productId} disabled={!!editing || !mode || !familyId || !familyProducts.length}
        onChange={(productId) => patch({ productId })} />
      <fieldset disabled={!product} className="item-measures form-stack">
      {mode === "SQUARE_FOOT" && <div className="form-grid">
        <div className="field">
          <label htmlFor="width">Ancho (cm)</label>
          <input
            id="width"
            placeholder="100"
            type="number"
            step="any"
            min="0.000001"
            inputMode="decimal"
            value={widthCm}
            onChange={(e) => patch({ widthCm: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="height">Alto (cm)</label>
          <input
            id="height"
            placeholder="80"
            type="number"
            step="any"
            min="0.000001"
            inputMode="decimal"
            value={heightCm}
            onChange={(e) => patch({ heightCm: e.target.value })}
            required
          />
        </div>
      </div>}
      <QuantityControl value={quantity ?? NaN} onChange={(quantity) => patch({ quantity: Number.isFinite(quantity) ? quantity : null })} label={mode === "SHEET" ? "Cantidad de planchas" : "Cantidad de paños / piezas"} />
      </fieldset>
      <div className="estimate">
        <span>Importe estimado</span>
        <strong>{estimate ? money(estimate.itemAmount) : "S/ —"}</strong>
      </div>
      {estimate && estimate.mode !== "SHEET" && (
        <div className="calculation-breakdown" aria-label="Desglose del cálculo estimado">
          <span>{quotationTechnicalDetail(estimate)}</span>
        </div>
      )}
      {error && <Notice error>{error}</Notice>}
      {editing ? (
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={!hydrated || !product}>Guardar cambios</Button>
        </div>
      ) : (
        <Button disabled={!hydrated || !product} type="submit">
          <Plus size={18} />
          Agregar ítem
        </Button>
      )}
    </form>
  );
}
