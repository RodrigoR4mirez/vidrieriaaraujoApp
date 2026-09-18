import Decimal from "decimal.js";
export const money = (value: string) => `S/ ${new Decimal(value).toFixed(2)}`;
export const limaDate = (value: string) =>
  new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(new Date(value));
