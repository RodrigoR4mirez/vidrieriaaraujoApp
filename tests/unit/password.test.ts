import { expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/infrastructure/auth/password";
it("hash con sal aleatoria y verificación segura", async () => {
  const value = "solo-fixture-no-credencial";
  const hash = await hashPassword(value);
  expect(hash).not.toContain(value);
  expect(await hashPassword(value)).not.toBe(hash);
  expect(await verifyPassword(value, hash)).toBe(true);
  expect(await verifyPassword("incorrecta", hash)).toBe(false);
  expect(await verifyPassword(value, "invalido")).toBe(false);
});
