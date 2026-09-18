import "server-only";
import { z } from "zod";
const authSchema = z.object({
  APP_USER: z.string().min(1),
  APP_PASSWORD_HASH: z.string().regex(/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/),
  SESSION_SECRET: z.string().min(32),
});
export function authEnv() {
  const result = authSchema.safeParse(process.env);
  if (!result.success)
    throw new Error(
      `Configura las variables de acceso: ${result.error.issues.map((i) => i.path.join(".")).join(", ")}`,
    );
  return result.data;
}
export function blobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token)
    throw new Error("Configura BLOB_READ_WRITE_TOKEN del store privado.");
  return token;
}
