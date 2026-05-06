"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export async function completeOnboarding(
  profileData?: { name?: string; avatarColor?: string | null } | undefined,
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthenticated");
  }

  await db
    .update(users)
    .set({
      onboardingCompleted: true,
      ...(profileData?.name ? { name: profileData.name } : {}),
      ...(profileData?.avatarColor !== undefined
        ? { avatarColor: profileData.avatarColor }
        : {}),
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/", "layout");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "onboarding_completed",
  });
}
