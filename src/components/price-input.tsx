"use client";
import { useLayoutEffect, useRef } from "react";
import Decimal from "decimal.js";
import { priceFromDigits } from "@/lib/price-input";

export function PriceInput({
  id, name, value, onChange, onBlur, inputRef, required,
}: {
  id: string;
  name: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  inputRef: (element: HTMLInputElement | null) => void;
  required: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    const input = ref.current;
    if (input && document.activeElement === input)
      input.setSelectionRange(input.value.length, input.value.length);
  }, [value]);
  return (
    <input
      ref={(element) => { ref.current = element; inputRef(element); }}
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      pattern="[0-9]+[.][0-9]{2}"
      maxLength={30}
      placeholder="0.00"
      required={required}
      value={value ? new Decimal(value).toFixed(2) : "0.00"}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={onBlur}
      onChange={(event) => {
        const formatted = priceFromDigits(event.target.value);
        if (formatted !== null) onChange(formatted || "0.00");
      }}
    />
  );
}
