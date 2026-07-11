const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

function parseAllowlist(): string[] {
  return parseAllowlistFrom(
    process.env.ALLOWED_WEB_ORIGINS ?? process.env.SITE_URL ?? "",
  );
}

function parseAllowlistFrom(raw: string): string[] {
  return raw
    .split(",")
    .map((entry) => entry.trim().replace(/\/$/, ""))
    .filter((entry) => entry.length > 0);
}

function isLocalhostHttpOrigin(url: URL): boolean {
  return url.protocol === "http:" && LOCALHOST_HOSTNAMES.has(url.hostname);
}

function allowlistIncludesLocalhostHttp(allowlist: string[]): boolean {
  return allowlist.some((entry) => {
    if (entry.endsWith(":*")) {
      try {
        const baseUrl = new URL(entry.slice(0, -2));
        return isLocalhostHttpOrigin(baseUrl);
      } catch {
        return false;
      }
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1)$/.test(entry)) {
      return entry.startsWith("http://");
    }
    try {
      const entryUrl = new URL(entry);
      return isLocalhostHttpOrigin(entryUrl);
    } catch {
      return false;
    }
  });
}

function matchesAllowlistEntry(url: URL, entry: string): boolean {
  if (entry.endsWith(":*")) {
    const base = entry.slice(0, -2);
    try {
      const baseUrl = new URL(base);
      return (
        url.protocol === baseUrl.protocol && url.hostname === baseUrl.hostname
      );
    } catch {
      return false;
    }
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)$/.test(entry)) {
    const entryUrl = new URL(entry);
    return (
      url.protocol === entryUrl.protocol && url.hostname === entryUrl.hostname
    );
  }

  const subdomainWildcard = entry.match(/^(https?:\/\/)\*\.(.+)$/);
  if (subdomainWildcard !== null) {
    const [, scheme, baseDomain] = subdomainWildcard;
    return (
      `${url.protocol}//` === scheme &&
      (url.hostname === baseDomain || url.hostname.endsWith(`.${baseDomain}`))
    );
  }

  return url.origin === entry;
}

/**
 * Whether an absolute web `redirectTo` may be returned to after an OAuth
 * round-trip. The web client sends its own origin, because a single deployment
 * can serve many origins — the dev backend is shared by localhost and every
 * `mr-*.suro.clotet.dev` preview, so SITE_URL alone can't validate them.
 *
 * Reads a comma-separated `ALLOWED_WEB_ORIGINS` (falling back to SITE_URL).
 * Each entry is an exact origin, may use a leading `*.` to match any subdomain
 * (e.g. `https://*.suro.clotet.dev`), or may end with `:*` to match any port
 * on that host (e.g. `http://localhost:*`). Any `http://localhost` entry also
 * covers every localhost port, so dynamic dev ports (Conductor, etc.) work
 * without listing each one.
 */
export function isAllowedWebOrigin(redirectTo: string): boolean {
  let url: URL;
  try {
    url = new URL(redirectTo);
  } catch {
    return false;
  }

  const allowlist = parseAllowlist();
  if (allowlist.length === 0) {
    return false;
  }

  if (isLocalhostHttpOrigin(url) && allowlistIncludesLocalhostHttp(allowlist)) {
    return true;
  }

  return allowlist.some((entry) => matchesAllowlistEntry(url, entry));
}

/** Test helper: validate against an explicit allowlist string. */
export function isAllowedWebOriginWithAllowlist(
  redirectTo: string,
  allowlistRaw: string,
): boolean {
  let url: URL;
  try {
    url = new URL(redirectTo);
  } catch {
    return false;
  }

  const allowlist = parseAllowlistFrom(allowlistRaw);
  if (allowlist.length === 0) {
    return false;
  }

  if (isLocalhostHttpOrigin(url) && allowlistIncludesLocalhostHttp(allowlist)) {
    return true;
  }

  return allowlist.some((entry) => matchesAllowlistEntry(url, entry));
}
