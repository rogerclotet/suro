"use server";

import { signIn } from "@/auth";

export async function login(provider: string, formData?: FormData) {
  await signIn(provider, formData);
}
