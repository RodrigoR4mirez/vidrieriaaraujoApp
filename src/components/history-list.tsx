"use client";
import { useState } from "react";
import Link from "next/link";
import type { Quotation } from "@/domain/quotation/models";
import { limaDate, money } from "@/lib/formatting";
import { EmptyState } from "./ui";
export function HistoryList({
  quotations,
}: {
  quotations: Pick<Quotation, "number" | "confirmedAt" | "customerName" | "total">[];
}) {
  const [query, setQuery] = useState("");
  const filtered = quotations.filter((q) =>
    `${q.number} ${q.customerName || ""} ${limaDate(q.confirmedAt)}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <section className="panel glass">
      <div className="toolbar">
        <input
          aria-label="Buscar cotización"
          placeholder="Buscar por cliente, número o fecha…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Link className="button primary" href="/cotizador">
          Nueva cotización
        </Link>
      </div>
      {filtered.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Cotización</th>
                <th>Cliente</th>
                <th>Fecha y hora</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.number}>
                  <td>
                    <Link className="text-link" href={`/cotizaciones/${q.number}`}>
                      {q.number}
                    </Link>
                  </td>
                  <td>{q.customerName || "No registrado"}</td>
                  <td>{limaDate(q.confirmedAt)}</td>
                  <td>{money(q.total)}</td>
                  <td>
                    <span className="badge active">Confirmada</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Sin cotizaciones para mostrar">
          Las cotizaciones confirmadas aparecerán aquí.
        </EmptyState>
      )}
    </section>
  );
}
