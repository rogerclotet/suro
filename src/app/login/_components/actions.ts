"use server";

import { signIn } from "@/auth";
import { getSafeRedirectTo } from "@/lib/auth-redirect";
import { getPostHogServer } from "@/lib/posthog-server";

export async function loginWithResend(formData?: FormData) {
  const redirectTo = getSafeRedirectTo(formData?.get("redirectTo")?.toString());
  const email = formData?.get("email")?.toString();

  try {
    const result = await signIn("resend", {
      email,
      redirect: false,
      redirectTo,
    });

    // signIn returns an error page URL instead of throwing when Resend fails
    if (typeof result === "string" && result.includes("/error")) {
      throw new Error("Magic link email failed to send");
    }
  } catch (e) {
    getPostHogServer().captureException(e, email ?? "anonymous", {
      action: "magic_link_send",
    });
    throw e;
  }
}

export async function loginWithGoogle(formData?: FormData) {
  const redirectTo = getSafeRedirectTo(formData?.get("redirectTo")?.toString());
  await signIn("google", { redirectTo });
}
