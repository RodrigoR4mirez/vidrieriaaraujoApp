"use client";
import Image from "next/image";
import { quotationItemDetail, quotationItemGroup, quotationItemName, quotationTechnicalDetail } from "@/lib/quotation-item";
import { useState } from "react";
import { Pencil, Trash2, List, Rows3 } from "lucide-react";
import { isProfileQuotationItem, type QuotationItem } from "@/domain/quotation/models";
import { quotationSubtotal, quotationTotal } from "@/domain/quotation/calculation";
import { money } from "@/lib/formatting";
import { EmptyState } from "./ui";
export function QuotationSummary({
  items,
  subtotal,
  total,
  onEdit,
  onDelete,
}: {
  items: QuotationItem[];
  subtotal?: string;
  total?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [compact, setCompact] = useState(false);
  const groups = Array.from(Map.groupBy(items, quotationItemGroup));
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Resumen de cotización</h2>
          <p className="muted">
            {onEdit
              ? "Productos agregados listos para cotizar"
              : "Detalle de la cotización confirmada"}
          </p>
        </div>
        <div className="segments" aria-label="Vista de cotización">
          <button
            aria-pressed={!compact}
            className={!compact ? "selected" : ""}
            onClick={() => setCompact(false)}
          >
            <List size={15} />
            Detallado
          </button>
          <button
            aria-pressed={compact}
            className={compact ? "selected" : ""}
            onClick={() => setCompact(true)}
          >
            <Rows3 size={15} />
            Compacto
          </button>
        </div>
      </div>
      {!items.length && (
        <EmptyState title="Empieza una nueva cotización">
          Selecciona el tipo de producto, completa sus datos y agrega el primer ítem.
        </EmptyState>
      )}
      <div className="quotation-groups">
        {groups.map(([name, group]) => (
          <div className="quotation-group" key={name}>
            <div className="group-heading">
                <strong>
                  <span className="blue-dot" />
                  {name} ({group.length})
                </strong>
                <span>
                  {group.length} {group.length === 1 ? "ítem" : "ítems"}
                </span>
            </div>
            <div className="table-scroll">
              <table className="quotation-table">
                <thead>
                  <tr>
                    <th>Producto / descripción</th>
                    <th>Modalidad / medidas</th>
                    <th>Cant.</th>
                    <th>P. unitario</th>
                    <th>Importe</th>
                    {onEdit && (
                      <th>
                        <span className="sr-only">Acciones</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {group.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="summary-product">
                          {isProfileQuotationItem(item) && item.imagePath && <span className="summary-profile-image">
                            <Image src={item.imagePath} alt="" fill sizes="44px" />
                          </span>}
                          <span><strong>{quotationItemName(item)}</strong>
                            {!compact && <small>{isProfileQuotationItem(item) ? item.family : item.productCode}</small>}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong>{quotationItemDetail(item)}</strong>
                        {!compact && (isProfileQuotationItem(item) || item.mode !== "SHEET") && (
                          <small className="item-calculation">
                            {quotationTechnicalDetail(item)}
                          </small>
                        )}
                      </td>
                      <td>{item.quantity}</td>
                      <td className="numeric muted">{money(item.unitPrice)}</td>
                      <td className="numeric">
                        <strong>{money(item.itemAmount)}</strong>
                      </td>
                      {onEdit && (
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon-button"
                              aria-label={`Editar ítem ${items.indexOf(item) + 1}`}
                              onClick={() => onEdit(item.id)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="icon-button danger"
                              aria-label={`Eliminar ítem ${items.indexOf(item) + 1}`}
                              onClick={() => onDelete?.(item.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      <div className="totals">
        <div>
          <span>Subtotal exacto</span>
          <strong data-testid="quotation-subtotal">
            {money(subtotal ?? quotationSubtotal(items))}
          </strong>
        </div>
        <div>
          <span>Total a cobrar</span>
          <strong data-testid="quotation-total">
            {money(total ?? quotationTotal(items))}
          </strong>
        </div>
        <div>
          <span>Ítems</span>
          <strong>{items.length}</strong>
        </div>
        <div>
          <span>Piezas</span>
          <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
        </div>
      </div>
    </>
  );
}
