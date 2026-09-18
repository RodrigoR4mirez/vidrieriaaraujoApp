import { expect, it } from "vitest";
import { priceFromDigits } from "@/lib/price-input";
import { priceInputSchema } from "@/domain/catalogs/models";

it("ingresa y borra precios desde los centavos con dos decimales", () => {
  expect(["1", "11", "111", "1110", "11100"].map(priceFromDigits))
    .toEqual(["0.01", "0.11", "1.11", "11.10", "111.00"]);
  expect(priceFromDigits("111.0")).toBe("11.10");
  expect(priceFromDigits("3.50")).toBe("3.50");
  expect(priceFromDigits("")).toBe("");
  expect(priceFromDigits("-100")).toBeNull();
});

it("admite cero y rechaza precios negativos o sin dos decimales", () => {
  for (const price of ["111", "1.1", "1.111", "-1.00"])
    expect(priceInputSchema.safeParse(price).success).toBe(false);
  expect(priceInputSchema.parse("0.00")).toBe("0.00");
  expect(priceInputSchema.parse("111.00")).toBe("111.00");
});
