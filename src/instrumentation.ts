import type { NextRequest, NextResponse } from "next/server";

export async function register() {}

export const onRequestError = async (
  err: Error,
  request: NextRequest,
  _context: NextResponse,
) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getPostHogServer } = await import("@/lib/posthog-server");
    const posthog = getPostHogServer();

    let distinctId = null;
    const cookie = request.headers?.get?.("cookie");
    if (cookie) {
      const postHogCookieMatch = cookie.match(/ph_phc_.*?_posthog=([^;]+)/);

      if (postHogCookieMatch?.[1]) {
        try {
          const decodedCookie = decodeURIComponent(postHogCookieMatch[1]);
          const postHogData = JSON.parse(decodedCookie);
          distinctId = postHogData.distinct_id;
        } catch (e) {
          console.error("Error parsing PostHog cookie:", e);
        }
      }
    }

    posthog.captureException(err, distinctId ?? undefined);
  }
};
