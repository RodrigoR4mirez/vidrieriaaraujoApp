"use client";
import { useQuotationDraft } from "./use-quotation-draft";
import { emptyForm, type QuotationForm } from "@/lib/quotation-draft-cache";
import { useHydrated } from "./use-hydrated";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, PanelsTopLeft, Plus, RotateCcw, Ruler, X } from "lucide-react";
import {
  type CatalogState,
  type SaleMode,
  isQuotable,
  productDetails,
} from "@/domain/catalogs/models";
import {
  draftItemSchema,
  isProfileDraftItem,
  type DraftItem,
  type ProfileDraftItem,
  type QuotationItem,
} from "@/domain/quotation/models";
import { priceDraft } from "@/application/use-cases";
import { confirmAction } from "@/app/actions";
import { money } from "@/lib/formatting";
import { quotationTechnicalDetail } from "@/lib/quotation-item";
import { profileMeasurementInCentimeters } from "@/domain/quotation/calculation";
import { quotationTotal } from "@/domain/quotation/calculation";
import { Button, Dialog, Notice, QuantityControl } from "./ui";
import {
  CatalogProductPicker,
  type PickerProduct,
} from "./catalog-product-picker";
import { QuotationSummary } from "./quotation-summary";
import type { AluminumCatalog } from "@/domain/aluminum/models";
import { ProfileItemForm } from "./profile-item-form";
export function QuotationBuilder({ catalog, aluminum, owner }: { catalog: CatalogState; aluminum: AluminumCatalog; owner: string }) {
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
    priced = priceDraft(items, catalog, aluminum);
  } catch (error) {
    pricingError = error instanceof Error ? error.message : "Revisa los ítems.";
  }
  let confirmTotal: string | undefined;
  if (!pending && !pricingError && priced.length) {
    try { confirmTotal = quotationTotal(priced); } catch { /* Keep the action label concise on an invalid draft. */ }
  }
  useEffect(() => {
    if (!warning || (!items.length && !customerName && !conditions && !form.mode)) return;
    const leave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [items.length, customerName, conditions, form.mode, warning]);
  const cancelEdit = () => update((old) => ({ ...old, editId: null,
    form: { ...emptyForm(), productType: old.form.productType },
  }));
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
  const saveItem = (item: DraftItem) => {
    update((old) => {
      const productType = isProfileDraftItem(item) ? "PROFILE" as const : "GLASS" as const;
      const fresh = { ...emptyForm(), productType };
      const nextForm = old.editId ? fresh : productType === "PROFILE"
        ? { ...old.form, profileId: "", profileFamilyId: "", colorId: "", metersRequested: "", profileMeasurementUnit: "CENTIMETERS" as const, quantity: 1 }
        : { ...old.form, productId: "", familyId: "", widthCm: "", heightCm: "", quantity: 1 };
      return {
        ...old,
        items: old.editId ? old.items.map((entry) => entry.id === old.editId ? item : entry) : [...old.items, item],
        editId: null,
        requestId: "",
        form: nextForm,
      };
    });
    setError("");
  };
  return (
    <fieldset disabled={pending || !hydrated} className="quotation-layout">
      <aside className="panel glass quote-form">
        <h2>
          <Ruler size={20} />
          Agregar ítem a la cotización
        </h2>
        <p className="muted">Selecciona vidrio o perfil y completa los datos.</p>
        <div className="segments product-tabs" aria-label="Tipo de producto">
          <button type="button" className={form.productType === "GLASS" ? "selected" : ""}
            aria-pressed={form.productType === "GLASS"} onClick={() => {
              update((old) => ({ ...old, editId: null, form: { ...emptyForm(), productType: "GLASS" } }));
              setError("");
            }}>Vidrio</button>
          <button type="button" className={form.productType === "PROFILE" ? "selected" : ""}
            aria-pressed={form.productType === "PROFILE"} onClick={() => {
              update((old) => ({ ...old, editId: null, form: { ...emptyForm(), productType: "PROFILE" } }));
              setError("");
            }}>Perfil</button>
        </div>
        {form.productType === "GLASS" && catalog.products.length ? (
          <ItemForm
            catalog={catalog}
            editing={items.find((i) => i.id === editId)}
            form={form}
            onFormChange={(next) => update((old) => ({ ...old, form: next }))}
            onSave={saveItem}
            onCancel={cancelEdit}
          />
        ) : form.productType === "GLASS" ? (
          <Notice>
            El catálogo está vacío.{" "}
            <Link href="/catalogos">Crea las opciones base</Link> y{" "}
            <Link href="/catalogo">agrega un vidrio</Link> para empezar.
          </Notice>
        ) : aluminum.profiles.length ? <ProfileItemForm
          catalog={aluminum}
          editing={items.find((item) => item.id === editId && isProfileDraftItem(item)) as ProfileDraftItem | undefined}
          form={form}
          onFormChange={(next) => update((old) => ({ ...old, form: next }))}
          onSave={saveItem}
          onCancel={cancelEdit}
        /> : <Notice>
          El catálogo de perfiles está vacío. <Link href="/perfiles">Carga la referencia inicial o crea perfiles</Link> para empezar.
        </Notice>}
      </aside>
      <section className="panel glass quote-summary">
        <QuotationSummary
          items={priced}
          onEdit={(id) => {
            const item = items.find((i) => i.id === id);
            if (!item) return;
            if (isProfileDraftItem(item)) {
              const profile = aluminum.profiles.find((entry) => entry.id === item.profileId);
              update((old) => ({ ...old, editId: id, form: {
                ...emptyForm(), productType: "PROFILE", profileMode: item.mode,
                profileFamilyId: profile?.familyId || "", profileId: item.profileId,
                colorId: item.colorId, metersRequested: item.mode === "PROFILE_METERS"
                  ? item.measurementUnit === "CENTIMETERS" ? item.measurementValue || item.metersRequested : profileMeasurementInCentimeters(item.metersRequested)
                  : "",
                profileMeasurementUnit: "CENTIMETERS",
                quantity: item.quantity,
              } }));
              return;
            }
            update((old) => ({ ...old, editId: id, form: {
              ...emptyForm(), productType: "GLASS", mode: item.mode ?? "SQUARE_FOOT", productId: item.productId,
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
            placeholder="Ej. 50% adelanto, entrega en 3 días"
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
            <span>{isProfileDraftItem(item)
              ? aluminum.profiles.find((profile) => profile.id === item.profileId)?.code || "Perfil no disponible"
              : catalog.products.find((p) => p.id === item.productId)?.code || "Vidrio no disponible"} · Cantidad: {item.quantity}</span>
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
              items.length || customerName || conditions || form.mode || form.widthCm || form.heightCm ||
                form.profileMode || form.profileFamilyId || form.profileId || form.colorId || form.metersRequested
                ? setResetOpen(true) : clear()
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
            {!pending && confirmTotal && <span className="confirm-amount" aria-hidden="true">· {money(confirmTotal)}</span>}
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
  const squareFootProducts = catalog.products.filter((product) =>
    isQuotable(product, catalog.values, "SQUARE_FOOT"));
  const sheetProducts = catalog.products.filter((product) =>
    isQuotable(product, catalog.values, "SHEET"));
  const available = mode === "SQUARE_FOOT" ? squareFootProducts : mode === "SHEET" ? sheetProducts : [];
  const families = catalog.values.filter((value) => value.category === "families" &&
    available.some((product) => product.familyId === value.id));
  const [error, setError] = useState("");
  const [availabilityNotice, setAvailabilityNotice] = useState("");
  const product = available.find((entry) => entry.id === productId);
  const pickerProducts: PickerProduct[] = available.map((entry) => {
    const details = productDetails(entry, catalog.values);
    const description = details.productDescription || entry.code;
    return {
      id: entry.id,
      code: entry.code,
      description,
      familyId: entry.familyId,
      familyName: details.family,
      measure: entry.sheetWidthCm && entry.sheetHeightCm
        ? `${entry.sheetWidthCm}×${entry.sheetHeightCm} cm`
        : "Sin medida de plancha",
      keyDetail: details.thickness || details.colorFinish || details.family,
    };
  });
  const selectedPickerProduct = pickerProducts.find((entry) => entry.id === productId);
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
      <div className="field sale-mode-section">
        <span className="field-label">Modalidad de venta (vidrio)</span>
        <div className="sale-mode-grid">
          <div className="sale-mode-choice">
            <button type="button" aria-pressed={mode === "SQUARE_FOOT"}
              className={mode === "SQUARE_FOOT" ? "selected" : ""}
              disabled={!squareFootProducts.length} onClick={() => {
                const nextMode: SaleMode = "SQUARE_FOOT";
                const current = catalog.products.find((entry) => entry.id === productId);
                const keepProduct = Boolean(current && isQuotable(current, catalog.values, nextMode));
                const nextFamily = familyId && squareFootProducts.some((entry) => entry.familyId === familyId)
                  ? familyId : "";
                onFormChange({ ...form, mode: nextMode, familyId: nextFamily,
                  productId: keepProduct ? productId : "" });
                setAvailabilityNotice(current && !keepProduct
                  ? "Este producto no se vende por pie² y se quitó de la selección." : "");
                setError("");
              }}><Ruler size={18} /><span>Por pie²</span></button>
            {!squareFootProducts.length && <small>Sin productos disponibles en esta modalidad</small>}
          </div>
          <div className="sale-mode-choice">
            <button type="button" aria-pressed={mode === "SHEET"}
              className={mode === "SHEET" ? "selected" : ""}
              disabled={!sheetProducts.length} onClick={() => {
                const nextMode: SaleMode = "SHEET";
                const current = catalog.products.find((entry) => entry.id === productId);
                const keepProduct = Boolean(current && isQuotable(current, catalog.values, nextMode));
                const nextFamily = familyId && sheetProducts.some((entry) => entry.familyId === familyId)
                  ? familyId : "";
                onFormChange({ ...form, mode: nextMode, familyId: nextFamily,
                  productId: keepProduct ? productId : "" });
                setAvailabilityNotice(current && !keepProduct
                  ? "Este producto no se vende por plancha y se quitó de la selección." : "");
                setError("");
              }}><PanelsTopLeft size={18} /><span>Por plancha</span></button>
            {!sheetProducts.length && <small>Sin productos disponibles en esta modalidad</small>}
          </div>
        </div>
      </div>
      <CatalogProductPicker label="Buscar vidrio" placeholder="Buscar o desplegar vidrios…"
        products={pickerProducts} families={families.map((family) => ({ id: family.id, name: family.name }))}
        value={productId} familyId={familyId} disabled={!mode || !available.length}
        recentKey="araujo:recent-glass-products"
        onChange={(nextProductId) => patch({ productId: nextProductId })}
        onFamilyChange={(nextFamilyId) => patch({
          familyId: nextFamilyId,
          productId: nextFamilyId && product && product.familyId !== nextFamilyId ? "" : productId,
        })} />
      {availabilityNotice && <Notice>{availabilityNotice}</Notice>}
      {product && selectedPickerProduct && <div className="selected-product-card">
        <div><strong>{product.code}</strong><span>{selectedPickerProduct.description}</span>
          <small>{selectedPickerProduct.measure} · {selectedPickerProduct.familyName}</small></div>
        <button type="button" className="icon-button" aria-label="Quitar vidrio seleccionado"
          onClick={() => patch({ productId: "" })}><X size={16} /></button>
      </div>}
      <fieldset disabled={!mode || !product} className="item-measures form-stack">
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
      <div className={`estimate ${!estimate ? "disabled-control" : ""}`}>
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
          <Button disabled={!hydrated || !estimate}>Guardar cambios</Button>
        </div>
      ) : (
        <Button disabled={!hydrated || !estimate} type="submit">
          <Plus size={18} />
          Agregar ítem
        </Button>
      )}
    </form>
  );
}
