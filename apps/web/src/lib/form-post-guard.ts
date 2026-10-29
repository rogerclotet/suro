// Next sends server-action calls with this header. Mirrors ACTION_HEADER in
// next/dist/client/components/app-router-headers.
const nextActionHeader = "next-action";

/**
 * Rejects multipart POSTs that aren't server-action calls.
 *
 * Next treats any such request to a page, including the not-found page an
 * unknown `/api/*` path renders, as a possible progressive-enhancement form
 * action and parses its body with `Request.formData()`, which throws (and
 * reports a 500) on a malformed body. Suro renders no `<form action>` and no
 * route handler accepts multipart (uploads go straight to Convex), so only
 * scanners send these. Exempt the path here if a route handler ever does.
 */
export function rejectFormPost(request: Request): Response | null {
  if (request.method !== "POST") return null;
  if (request.headers.has(nextActionHeader)) return null;
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) return null;
  return new Response("Unsupported Media Type", {
    status: 415,
    headers: { "content-type": "text/plain" },
  });
}
