import { beforeEach, expect, it, vi } from "vitest";
import { get, put, list, BlobPreconditionFailedError } from "@vercel/blob";
import { VercelBlobStore } from "@/infrastructure/persistence/blob/store";
vi.mock("@vercel/blob", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@vercel/blob")>()),
  get: vi.fn(),
  put: vi.fn(),
  list: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
it("lectura privada omite cache y conserva ETag", async () => {
  vi.mocked(get).mockResolvedValue({
    statusCode: 200,
    stream: new Blob(['{"schemaVersion":1}']).stream(),
    blob: {
      etag: "etag",
      pathname: "data/v1/catalog.json",
      contentType: "application/json",
    },
  } as Awaited<ReturnType<typeof get>>);
  expect(
    await new VercelBlobStore("fixture").read("data/v1/catalog.json"),
  ).toEqual({ value: { schemaVersion: 1 }, etag: "etag" });
  expect(get).toHaveBeenCalledWith("data/v1/catalog.json", {
    access: "private",
    useCache: false,
    token: "fixture",
    headers: { "Accept-Encoding": "identity" },
  });
});
it("creación inmutable y actualización condicional", async () => {
  const store = new VercelBlobStore("fixture");
  await store.write("q.json", {});
  await store.write("catalog.json", {}, "old");
  expect(put).toHaveBeenNthCalledWith(
    1,
    "q.json",
    "{}",
    expect.objectContaining({
      allowOverwrite: false,
      addRandomSuffix: false,
      access: "private",
    }),
  );
  expect(put).toHaveBeenNthCalledWith(
    2,
    "catalog.json",
    "{}",
    expect.objectContaining({ allowOverwrite: true, ifMatch: "old" }),
  );
  vi.mocked(put).mockRejectedValueOnce(new BlobPreconditionFailedError());
  await expect(store.write("catalog.json", {}, "old")).rejects.toThrow(
    "Conflicto",
  );
});
it("recorre todas las páginas de Blob", async () => {
  vi.mocked(list)
    .mockResolvedValueOnce({
      blobs: [{ pathname: "one" }],
      hasMore: true,
      cursor: "next",
    } as Awaited<ReturnType<typeof list>>)
    .mockResolvedValueOnce({
      blobs: [{ pathname: "two" }],
      hasMore: false,
    } as Awaited<ReturnType<typeof list>>);
  expect(await new VercelBlobStore("fixture").paths("data/v1/")).toEqual([
    "one",
    "two",
  ]);
  expect(list).toHaveBeenLastCalledWith(
    expect.objectContaining({ cursor: "next" }),
  );
});
