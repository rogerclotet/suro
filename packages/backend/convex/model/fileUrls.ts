import type { Id } from "../_generated/dataModel";

/**
 * Branded, token-gated URLs for stored blobs.
 *
 * Convex's `ctx.storage.getUrl` always points at `*.convex.cloud`, which we
 * can't rebrand. Instead we serve blobs through our own `GET /f` HTTP route
 * (see `http.ts`) and front the Convex HTTP-actions host with a domain we own,
 * so the URL the clients see is e.g. `https://files.suroapp.cat/f?...`.
 *
 * The route is public, so the URL carries `token = HMAC(storageId)`: only the
 * holder of a minted URL can fetch the blob — the same bearer-secret model as
 * the calendar feed. The signing key lives in `FILE_URL_SECRET` (a Convex
 * deployment env var). Until it's set, we fall back to the raw Convex URL so the
 * app keeps working before the env var + proxy are in place.
 */

/** The signing secret, or null when branded URLs aren't configured yet. */
function secret(): string | null {
  return process.env.FILE_URL_SECRET ?? null;
}

/**
 * Origin that serves `/f`: the branded host (`FILE_URL_BASE`) when set,
 * otherwise this deployment's Convex HTTP-actions origin (`CONVEX_SITE_URL`,
 * injected by Convex). This lets us roll out in stages — secret first (serves
 * from `*.convex.site`), then `FILE_URL_BASE` once DNS/proxy is live.
 */
function base(): string {
  const origin = process.env.FILE_URL_BASE ?? process.env.CONVEX_SITE_URL;
  if (!origin) {
    throw new Error("Neither FILE_URL_BASE nor CONVEX_SITE_URL is set");
  }
  return origin.replace(/\/$/, "");
}

const encoder = new TextEncoder();

async function hmac(message: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message),
  );
  return base64Url(new Uint8Array(signature));
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Constant-time string compare to keep token checks free of timing leaks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Public serving URL for a stored blob. Returns a branded, token-signed `/f`
 * URL when `FILE_URL_SECRET` is set; otherwise falls back to `getUrl` (the raw
 * `*.convex.cloud` URL). `getUrl` is passed in so callers control which ctx
 * (query/mutation) signs it — and so the fallback reuses a URL they may already
 * hold. Returns null only when the fallback itself yields null (blob missing).
 *
 * `name`, when given, rides along as a cosmetic query param the `/f` route
 * echoes into `Content-Disposition` so the browser shows the real file name
 * (e.g. as the PDF tab title) instead of "f". It's outside the signature — it
 * doesn't gate access, so leaving it unsigned is fine.
 */
export async function serveFileUrl(
  storageId: Id<"_storage">,
  getUrl: (id: Id<"_storage">) => Promise<string | null>,
  name?: string,
): Promise<string | null> {
  const key = secret();
  if (key === null) {
    return getUrl(storageId);
  }
  const token = await hmac(storageId, key);
  const nameParam = name ? `&name=${encodeURIComponent(name)}` : "";
  return `${base()}/f?id=${storageId}&token=${token}${nameParam}`;
}

/**
 * Verify a token minted by `serveFileUrl` for `storageId`. Always false when no
 * signing secret is configured (the `/f` route shouldn't serve anything then).
 */
export async function verifyFileToken(
  storageId: string,
  token: string,
): Promise<boolean> {
  const key = secret();
  if (key === null) {
    return false;
  }
  const expected = await hmac(storageId, key);
  return timingSafeEqual(expected, token);
}
