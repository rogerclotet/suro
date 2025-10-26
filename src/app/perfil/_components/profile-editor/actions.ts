"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as v from "valibot";
import { auth } from "@/auth";
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
    .set({ name: parsedData.name })
    .where(eq(users.id, session.user.id));

  revalidatePath("/");
}
