// Cash-register entry: each digit shifts the amount from right to left.
export function priceFromDigits(raw: string): string | null {
  if (!/^[\d.,]*$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const padded = (digits.replace(/^0+/, "") || "0").padStart(3, "0");
  return `${padded.slice(0, -2)}.${padded.slice(-2)}`;
}
