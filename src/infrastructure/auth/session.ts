import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { authEnv } from "@/config/env";
const COOKIE = "araujo_session";
export async function session() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const env = authEnv();
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(env.SESSION_SECRET),
      { algorithms: ["HS256"], issuer: "araujo", audience: "araujo-app" },
    );
    return payload.sub === env.APP_USER ? payload : null;
  } catch {
    return null;
  }
}
export async function requireSession() {
  const result = await session();
  if (!result) redirect("/login");
  return result;
}
export async function createSession(remember: boolean) {
  const env = authEnv();
  const seconds = remember ? 60 * 60 * 24 * 7 : 60 * 60 * 8;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(env.APP_USER)
    .setIssuer("araujo")
    .setAudience("araujo-app")
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(new TextEncoder().encode(env.SESSION_SECRET));
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: seconds,
  });
}
export async function deleteSession() {
  (await cookies()).delete(COOKIE);
}
