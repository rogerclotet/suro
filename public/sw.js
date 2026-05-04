const CACHE_NAME = "suro-v2";

const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/favicon.png"];

// Sections that should be proactively cached when any section is visited.
const SECTION_PATHS = ["llistes", "calendari", "notes", "despeses"];

// Install: pre-cache essential assets
self.addEventListener("install", (event) => {
  console.log("[sw] Installing service worker");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[sw] Pre-caching URLs:", PRECACHE_URLS);
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("[sw] Failed to pre-cache:", err);
      });
    }),
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  console.log("[sw] Activating service worker");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip external
  if (url.origin !== self.location.origin) return;

  // Skip auth, health, and mutation APIs
  if (url.pathname.startsWith("/api/auth")) return;
  if (url.pathname.startsWith("/api/health")) return;
  if (url.pathname.startsWith("/api/offline/sync")) return;
  if (url.pathname.startsWith("/api/uploadthing")) return;
  if (url.pathname.startsWith("/api/web-push")) return;

  // Static assets: cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else (pages, RSC, data): network-first with cache fallback.
  // Stale-while-revalidate was causing a visible flash of stale content on
  // refresh — the cached page with old sort order / completed states was
  // shown before the fresh network response arrived.
  event.respondWith(networkFirst(request));
});

// Only truly immutable assets get cache-first (images, fonts, icons).
// JS/CSS bundles use network-first: in dev they lack content hashes so the
// same URL can serve different content after an HMR edit; in production they
// are content-addressed so network always returns the same bytes as cache.
function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/fonts/") ||
    /\.(png|jpg|jpeg|svg|ico|woff2?|webp)$/.test(pathname)
  );
}

// Returns [projectBase, sectionName] if the path is a known section page.
function getSectionMatch(pathname) {
  return pathname.match(
    /^(\/grups\/[^/]+)\/(llistes|calendari|notes|despeses)(\/|$)/,
  );
}

// When a section page is served from the network, proactively fetch and cache
// all sibling sections as plain HTML. This ensures they are available offline
// even if the user never navigated to them directly. Uses ignoreVary so that
// even if only an RSC-variant was previously cached, we detect the entry.
function precacheSiblings(url, cache) {
  const match = getSectionMatch(url.pathname);
  if (!match) return;
  const [, base, current] = match;

  for (const section of SECTION_PATHS) {
    if (section === current) continue;
    const siblingUrl = `${url.origin}${base}/${section}`;
    cache.match(siblingUrl, { ignoreVary: true }).then((existing) => {
      if (existing) return;
      // Fetch without RSC headers so Next.js returns a full HTML response,
      // then cache the HTML and all JS chunks it references.
      cachePageWithChunks(siblingUrl, url.origin, cache);
    });
  }
}

// Fetch an HTML page and cache it together with all /_next/static/ chunks
// referenced in its markup. Prevents "Failed to load chunk" errors when the
// cached HTML is served offline but its companion chunks are not yet in cache.
function cachePageWithChunks(pageUrl, origin, cache) {
  fetch(pageUrl)
    .then(async (r) => {
      if (!r.ok) return;
      const toCache = r.clone();
      const html = await r.text();
      await cache.put(pageUrl, toCache);
      cacheChunksFromHtml(html, origin, cache);
    })
    .catch(() => {});
}

// Parse an HTML string for /_next/static/ script paths and cache any that are
// not already present. Runs fire-and-forget.
function cacheChunksFromHtml(html, origin, cache) {
  const pattern = /\/_next\/static\/[^"'\s\\]+\.js/g;
  const paths = [...new Set([...html.matchAll(pattern)].map((m) => m[0]))];
  for (const path of paths) {
    const chunkUrl = `${origin}${path}`;
    cache.match(chunkUrl, { ignoreVary: true }).then((cached) => {
      if (cached) return;
      fetch(chunkUrl)
        .then((r) => {
          if (r.ok) cache.put(chunkUrl, r.clone());
        })
        .catch(() => {});
    });
  }
}

async function cacheFirst(request) {
  // ignoreVary so content-addressed assets are always found regardless of
  // request header variations.
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      const url = new URL(request.url);
      if (response.headers.get("content-type")?.includes("text/html")) {
        response
          .clone()
          .text()
          .then((html) => {
            cacheChunksFromHtml(html, url.origin, cache);
          })
          .catch(() => {});
        precacheSiblings(url, cache);
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed — serve from cache for offline support
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;

    if (request.headers.get("accept")?.includes("text/html")) {
      return offlinePage(request.url);
    }
    return new Response("Offline", { status: 503 });
  }
}

const SECTION_NAMES = {
  llistes: "Llistes",
  calendari: "Calendari",
  notes: "Notes",
  despeses: "Despeses",
};

async function offlinePage(requestUrl) {
  let sectionsHtml = "";

  try {
    const url = new URL(requestUrl);
    const match = getSectionMatch(url.pathname);
    if (match) {
      const [, base] = match;
      const cache = await caches.open(CACHE_NAME);
      const links = [];
      for (const section of SECTION_PATHS) {
        const sectionUrl = `${url.origin}${base}/${section}`;
        const cached = await cache.match(sectionUrl, { ignoreVary: true });
        if (cached) {
          links.push(
            `<a href="${base}/${section}" class="section-link">${SECTION_NAMES[section]}</a>`,
          );
        }
      }
      if (links.length > 0) {
        sectionsHtml = `<div class="sections"><p class="sections-label">Disponible offline</p><div class="section-links">${links.join("")}</div></div>`;
      }
    }
  } catch (_) {}

  return new Response(
    `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suro</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      min-height: 100dvh;
      background: #2a1a14;
      background: oklch(0.225 0.025 40);
      color: #ece2d2;
      color: oklch(0.86 0.012 75);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      width: 100%;
      max-width: 340px;
      background: #221610;
      background: oklch(0.19 0.025 38);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 0.75rem;
      padding: 1.75rem;
      text-align: center;
    }
    .icon-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px; height: 44px;
      background: rgba(255,255,255,0.06);
      border-radius: 0.5rem;
      margin-bottom: 1.125rem;
    }
    h1 { font-size: 1rem; font-weight: 600; margin-bottom: 0.375rem; }
    p { font-size: 0.8125rem; color: #b6a791; color: oklch(0.68 0.028 60); line-height: 1.55; margin-bottom: 1.25rem; }
    .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.4375rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.8125rem; font-weight: 500;
      cursor: pointer; text-decoration: none; border: none;
      font-family: inherit;
      transition: opacity 0.15s ease;
    }
    .btn:hover { opacity: 0.82; }
    .btn-ghost {
      background: rgba(255,255,255,0.07);
      color: #ece2d2; color: oklch(0.86 0.012 75);
    }
    .btn-primary { background: #6fa05a; background: oklch(0.6 0.13 139.5); color: #fff; }
    .sections {
      margin-top: 1.125rem;
      padding-top: 1.125rem;
      border-top: 1px solid rgba(255,255,255,0.07);
    }
    .sections-label {
      font-size: 0.6875rem; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: #8c7a64; color: oklch(0.55 0.03 55);
      margin-bottom: 0.625rem;
    }
    .section-links { display: flex; flex-wrap: wrap; gap: 0.375rem; justify-content: center; }
    .section-link {
      display: inline-block;
      padding: 0.3125rem 0.75rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 0.375rem;
      font-size: 0.8125rem;
      color: #ece2d2; color: oklch(0.86 0.012 75);
      text-decoration: none;
      transition: background 0.15s ease;
    }
    .section-link:hover { background: rgba(255,255,255,0.1); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="oklch(0.68 0.028 60)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="2" y1="2" x2="22" y2="22"/>
        <path d="M8.5 16.5a5 5 0 0 1 7 0"/>
        <path d="M2 8.82a15 15 0 0 1 4.17-2.65"/>
        <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/>
        <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/>
        <path d="M5 13a10 10 0 0 1 5.24-2.76"/>
        <circle cx="12" cy="20" r="1"/>
      </svg>
    </div>
    <h1>Sense connexió</h1>
    <p>No hi ha connexió a internet. Visita aquesta secció amb connexió per poder-la veure sense connexió.</p>
    <div class="actions">
      <button class="btn btn-ghost" onclick="history.length>1?history.back():location.href='/'">Enrere</button>
      <button class="btn btn-primary" onclick="location.reload()">Tornar a intentar</button>
    </div>
    ${sectionsHtml}
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

// Background Sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-mutations") {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "SYNC_REQUESTED" });
  });
}

// Push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const { title, body, tag, icon, badge, image, timestamp, path } = payload;

  event.waitUntil(
    self.registration.showNotification(title ?? "Suro", {
      body,
      tag,
      icon: icon ?? `${self.location.origin}/favicon.png`,
      badge: badge ?? `${self.location.origin}/favicon.png`,
      image,
      timestamp,
      data: { path },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.path ?? "/"));
});
