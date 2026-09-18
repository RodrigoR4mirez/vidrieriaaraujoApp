import { get, put, list, BlobPreconditionFailedError } from "@vercel/blob";
import { AlreadyExistsError, ConflictError } from "@/domain/errors";

import type { JsonStore } from "@/application/json-store";
export type { JsonStore } from "@/application/json-store";
export class VercelBlobStore implements JsonStore {
  constructor(private token: string) {}
  async read(path: string) {
    const result = await get(path, {
      access: "private",
      useCache: false,
      token: this.token,
      // Compressed responses use weak ETags, which cannot satisfy ifMatch.
      // Read the identity representation so the body and strong ETag stay paired.
      headers: { "Accept-Encoding": "identity" },
    });
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream)
      throw new Error("Lectura Blob incompleta");
    return {
      value: (await new Response(result.stream).json()) as unknown,
      etag: result.blob.etag,
    };
  }
  async write(path: string, value: unknown, etag?: string) {
    try {
      await put(path, JSON.stringify(value), {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
        cacheControlMaxAge: 60,
        token: this.token,
        allowOverwrite: !!etag,
        ...(etag ? { ifMatch: etag } : {}),
      });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError)
        throw new ConflictError();
      // The SDK reports create-only collisions as BlobError (no specific exported class).
      if (error instanceof Error && /already exists/i.test(error.message))
        throw new AlreadyExistsError();
      throw error;
    }
  }
  async paths(prefix: string) {
    const paths: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({
        prefix,
        cursor,
        limit: 1000,
        token: this.token,
      });
      paths.push(...page.blobs.map((b) => b.pathname));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return paths;
  }
}
