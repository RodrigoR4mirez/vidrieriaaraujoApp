"use client";
import { useHydrated } from "./use-hydrated";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, RotateCcw, Ruler } from "lucide-react";
import {
  type CatalogState,
  isQuotable,
  productDetails,
} from "@/domain/catalogs/models";
import {
  draftItemSchema,
  type DraftItem,
  type QuotationItem,
} from "@/domain/quotation/models";
import { calculateItem } from "@/domain/quotation/calculation";
import { priceDraft } from "@/application/use-cases";
import { confirmAction } from "@/app/actions";
import { money } from "@/lib/formatting";
import { Button, Dialog, Notice, QuantityControl } from "./ui";
import { QuotationSummary } from "./quotation-summary";
export function QuotationBuilder({ catalog }: { catalog: CatalogState }) {
  const [items, setItems] = useState<DraftItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [conditions, setConditions] = useState("");
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [requestId, setRequestId] = useState("");
  const router = useRouter();
  const available = {
    ...catalog,
    products: catalog.products.filter((p) => isQuotable(p, catalog.values)),
  };
  let priced: QuotationItem[] = [];
  let pricingError = "";
  try {
    priced = priceDraft(items, catalog);
  } catch (error) {
    pricingError = error instanceof Error ? error.message : "Revisa los ítems.";
  }
  useEffect(() => {
    if (!items.length && !conditions) return;
    const leave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [items.length, conditions]);
  const changed = () => {
    setRequestId("");
    setError("");
  };
  const clear = () => {
    setItems([]);
    setConditions("");
    setEditId(null);
    changed();
    setResetOpen(false);
  };
  return (
    <fieldset disabled={pending} className="quotation-layout">
      <aside className="panel glass quote-form">
        <h2>
          <Ruler size={20} />
          Agregar vidrio
        </h2>
        <p className="muted">Selecciona el vidrio y completa las medidas.</p>
        {available.products.length ? (
          <ItemForm
            key={editId || "new"}
            catalog={available}
            editing={items.find((i) => i.id === editId)}
            onSave={(item) => {
              setItems((old) =>
                editId
                  ? old.map((i) => (i.id === editId ? item : i))
                  : [...old, item],
              );
              setEditId(null);
              changed();
            }}
            onCancel={() => setEditId(null)}
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
          onEdit={(id) => setEditId(id)}
          onDelete={(id) => {
            setItems((old) => old.filter((i) => i.id !== id));
            if (editId === id) setEditId(null);
            changed();
          }}
        />
        <div className="field conditions-field">
          <label htmlFor="conditions">Condiciones comerciales (opcional)</label>
          <textarea
            id="conditions"
            rows={2}
            maxLength={2000}
            placeholder="Indica las condiciones acordadas para esta proforma."
            value={conditions}
            onChange={(e) => {
              setConditions(e.target.value);
              changed();
            }}
          />
        </div>
        {(error || pricingError) && (
          <Notice error>{error || pricingError}</Notice>
        )}
        <div className="form-actions">
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              items.length || conditions ? setResetOpen(true) : clear()
            }
          >
            <RotateCcw size={17} />
            Nueva proforma
          </Button>
          <Button
            disabled={!items.length || !!pricingError || pending || !!editId}
            onClick={() =>
              startTransition(async () => {
                const id = requestId || crypto.randomUUID();
                setRequestId(id);
                const result = await confirmAction({
                  requestId: id,
                  items,
                  conditions,
                });
                if (!result.ok) setError(result.error);
                else {
                  setItems([]);
                  setConditions("");
                  router.push(`/proformas/${result.data.number}`);
                  router.refresh();
                }
              })
            }
          >
            {pending ? "Confirmando…" : "Confirmar proforma"}
            <ArrowRight size={18} />
          </Button>
        </div>
      </section>
      {resetOpen && (
        <Dialog
          title="¿Crear una nueva proforma?"
          onClose={() => setResetOpen(false)}
        >
          <p>
            Se descartará el borrador actual. Las proformas confirmadas se
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
  onSave,
  onCancel,
}: {
  catalog: CatalogState;
  editing?: DraftItem;
  onSave: (item: DraftItem) => void;
  onCancel: () => void;
}) {
  const hydrated = useHydrated();
  const [productId, setProductId] = useState(
    editing?.productId || catalog.products[0]?.id || "",
  );
  const [widthCm, setWidth] = useState(editing?.widthCm || "");
  const [heightCm, setHeight] = useState(editing?.heightCm || "");
  const [quantity, setQuantity] = useState(editing?.quantity || 1);
  const [error, setError] = useState("");
  const product = catalog.products.find((p) => p.id === productId);
  const variants = catalog.products.filter(
    (p) =>
      p.familyId === product?.familyId &&
      p.colorFinishId === product?.colorFinishId &&
      p.cathedralDesignId === product?.cathedralDesignId,
  );
  let estimate = "";
  if (product) {
    try {
      estimate = calculateItem({
        widthCm,
        heightCm,
        quantity,
        pricePerSquareFoot: product.pricePerSquareFoot,
      }).itemAmount;
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
          productId,
          widthCm,
          heightCm,
          quantity,
        });
        if (!parsed.success) {
          setError(parsed.error.issues[0].message);
          return;
        }
        onSave(parsed.data);
        setError("");
        if (!editing) {
          setWidth("");
          setHeight("");
          setQuantity(1);
        }
      }}
    >
      {editing && <Notice>Editar medidas y cantidad</Notice>}
      <div className="field">
        <label htmlFor="glass-select">Tipo de vidrio</label>
        <select
          id="glass-select"
          value={productId}
          disabled={!!editing}
          onChange={(e) => setProductId(e.target.value)}
          required
        >
          {catalog.products.map((p) => (
            <option key={p.id} value={p.id}>
              {productDetails(p, catalog.values).productDescription} · {p.code}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Espesor del cristal</label>
        <div className="thickness-pills">
          {variants.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={!!editing}
              aria-pressed={productId === p.id}
              className={productId === p.id ? "selected" : ""}
              onClick={() => setProductId(p.id)}
            >
              {productDetails(p, catalog.values).thickness}
            </button>
          ))}
        </div>
      </div>
      <div className="form-grid">
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
            onChange={(e) => setWidth(e.target.value)}
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
            onChange={(e) => setHeight(e.target.value)}
            required
          />
        </div>
      </div>
      <QuantityControl value={quantity} onChange={setQuantity} />
      <div className="estimate">
        <span>Importe estimado</span>
        <strong>{estimate ? money(estimate) : "S/ —"}</strong>
      </div>
      {error && <Notice error>{error}</Notice>}
      {editing ? (
        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={!hydrated}>Guardar cambios</Button>
        </div>
      ) : (
        <Button disabled={!hydrated} type="submit">
          <Plus size={18} />
          Agregar ítem
        </Button>
      )}
    </form>
  );
}
