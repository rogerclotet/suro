import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ProfileEditor from "./_components/profile-editor/profile-editor";

export default async function PerfilPage() {
  const session = await auth();
  if (!session) {
    return redirect("/");
  }

  return <ProfileEditor user={session.user} />;
}
