import { convexSiteUrl } from "@/lib/convex-site-url";

export const dynamic = "force-dynamic";

/**
 * Public calendar feed on our own domain. Proxies to the Convex HTTP route so
 * shared URLs read as `https://suroapp.cat/calendar.ics?...` instead of
 * `*.convex.site`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = `${convexSiteUrl()}/calendar.ics${url.search}`;

  const upstream = await fetch(target);
  const headers = new Headers();
  const contentType = upstream.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  const disposition = upstream.headers.get("Content-Disposition");
  if (disposition) {
    headers.set("Content-Disposition", disposition);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
