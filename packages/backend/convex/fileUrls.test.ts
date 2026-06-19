import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { Id } from "./_generated/dataModel";
import { serveFileUrl, verifyFileToken } from "./model/fileUrls";
import schema from "./schema";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

// FILE_URL_SECRET / FILE_URL_BASE are set in vitest.config.ts, so signing is on.
describe("file URLs: branded token-gated serving", () => {
  it("mints a branded /f URL whose token round-trips", async () => {
    const id = "storage-id-1" as Id<"_storage">;
    const url = await serveFileUrl(id, () =>
      Promise.resolve("https://x.convex.cloud/raw"),
    );
    expect(url).toMatch(/^https:\/\/files\.test\.suroapp\.cat\/f\?id=/);

    const token = new URL(url ?? "").searchParams.get("token") ?? "";
    expect(await verifyFileToken(id, token)).toBe(true);
    expect(await verifyFileToken(id, "tampered")).toBe(false);
    expect(await verifyFileToken("other-id", token)).toBe(false);
  });

  it("serves the blob through GET /f only with a valid token", async () => {
    const t = convexTest(schema, modules);
    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob(["hello"])),
    );
    const url = await serveFileUrl(storageId, () => Promise.resolve("unused"));
    const { pathname, search } = new URL(url ?? "");

    const ok = await t.fetch(`${pathname}${search}`);
    expect(ok.status).toBe(200);
    expect(await ok.text()).toBe("hello");

    const forged = await t.fetch(`/f?id=${storageId}&token=tampered`);
    expect(forged.status).toBe(403);

    const missing = await t.fetch("/f");
    expect(missing.status).toBe(400);
  });
});
