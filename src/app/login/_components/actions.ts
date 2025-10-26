"use server";

import { signIn } from "@/auth";

export async function loginWithResend(formData?: FormData) {
  await signIn("resend", {
    email: formData?.get("email"),
    redirect: false,
  });
}

export async function loginWithGoogle() {
  await signIn("google");
}
