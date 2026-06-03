import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import ProfileEditor from "./_components/profile-editor/profile-editor";

export default async function PerfilPage() {
  const session = await auth();
  if (!session) {
    return redirect("/");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  if (!user) {
    return redirect("/");
  }

  return <ProfileEditor user={user} />;
}
