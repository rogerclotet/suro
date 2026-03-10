"use server";

import { signIn } from "@/auth";
import { getSafeRedirectTo } from "@/lib/auth-redirect";

export async function loginWithResend(formData?: FormData) {
  const redirectTo = getSafeRedirectTo(formData?.get("redirectTo")?.toString());
  await signIn("resend", {
    email: formData?.get("email"),
    redirect: false,
    redirectTo,
  });
}

export async function loginWithGoogle(formData?: FormData) {
  const redirectTo = getSafeRedirectTo(formData?.get("redirectTo")?.toString());
  await signIn("google", { redirectTo });
}
