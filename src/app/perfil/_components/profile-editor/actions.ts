"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { auth } from "@/auth";
import { getPostHogServer } from "@/lib/posthog-server";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { utapi } from "@/server/uploadthing";
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
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "edit_profile",
  });
}

export async function resetProfileImage() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthenticated");
  }

  const user = await db.query.users.findFirst({
    columns: { customImage: true },
    where: eq(users.id, session.user.id),
  });

  if (user?.customImage) {
    const key = user.customImage.split("/").pop();
    if (key) {
      await utapi.deleteFiles([key]);
    }
  }

  await db
    .update(users)
    .set({ customImage: null })
    .where(eq(users.id, session.user.id));

  revalidatePath("/");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "reset_profile_image",
  });
}

export async function removeProfileImage() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthenticated");
  }

  const user = await db.query.users.findFirst({
    columns: { customImage: true },
    where: eq(users.id, session.user.id),
  });

  if (user?.customImage) {
    const key = user.customImage.split("/").pop();
    if (key) {
      await utapi.deleteFiles([key]);
    }
  }

  await db
    .update(users)
    .set({ customImage: null, image: null })
    .where(eq(users.id, session.user.id));

  revalidatePath("/");

  getPostHogServer().capture({
    distinctId: session.user.id,
    event: "remove_profile_image",
  });
}
