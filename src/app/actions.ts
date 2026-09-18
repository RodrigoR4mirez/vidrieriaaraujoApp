"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { unstable_rethrow } from "next/navigation";
import { services } from "@/application/container";
import { DomainError } from "@/domain/errors";
import { authEnv } from "@/config/env";
import { verifyPassword } from "@/infrastructure/auth/password";
import {
  createSession,
  deleteSession,
  requireSession,
} from "@/infrastructure/auth/session";
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string };
async function result<T>(
  operation: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof z.ZodError)
      return {
        ok: false,
        error: error.issues[0]?.message || "Revisa los campos.",
      };
    if (error instanceof DomainError)
      return { ok: false, error: error.message };
    console.error(
      "Operación fallida",
      error instanceof Error ? error.name : "Error",
    );
    return {
      ok: false,
      error:
        "No se pudo completar la operación. Verifica la conexión y vuelve a intentarlo.",
    };
  }
}
export async function loginAction(raw: unknown): Promise<ActionResult<null>> {
  return result(async () => {
    const input = z
      .object({
        username: z.string().trim().min(1).max(200),
        password: z.string().min(1).max(256),
        remember: z.boolean(),
      })
      .parse(raw);
    const env = authEnv();
    const correct = await verifyPassword(input.password, env.APP_PASSWORD_HASH);
    if (!correct || input.username !== env.APP_USER)
      throw new DomainError("Usuario o contraseña incorrectos.");
    await createSession(input.remember);
    return null;
  });
}
export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
const editSchema = z.object({
  id: z.string().uuid().optional(),
  revision: z.number().int().positive().optional(),
});
export async function saveProductAction(raw: unknown, edit: unknown) {
  await requireSession();
  return result(async () => {
    const { id, revision } = editSchema.parse(edit);
    const saved = await services().catalog.saveProduct(raw, id, revision);
    revalidatePath("/", "layout");
    return saved;
  });
}
export async function saveBaseAction(raw: unknown, edit: unknown) {
  await requireSession();
  return result(async () => {
    const { id, revision } = editSchema.parse(edit);
    const saved = await services().catalog.saveBase(raw, id, revision);
    revalidatePath("/", "layout");
    return saved;
  });
}
export async function confirmAction(raw: unknown) {
  await requireSession();
  return result(async () => {
    const saved = await services().quotations.confirm(raw);
    revalidatePath("/proformas");
    return { number: saved.number };
  });
}
