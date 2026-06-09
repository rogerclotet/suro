"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import * as v from "valibot";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { profileSchema } from "./data";

export async function editProfile(data: v.InferInput<typeof profileSchema>) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthenticated");
  }

  const parsedData = v.parse(profileSchema, data);

  await db
    .update(users)
    .set({
      name: parsedData.name,
      avatarColor: parsedData.avatarColor ?? null,
      dateLocale: parsedData.dateLocale,
      locale: parsedData.locale,
    })
    .where(eq(users.id, session.user.id));

  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", parsedData.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "edit_profile",
  });
}
