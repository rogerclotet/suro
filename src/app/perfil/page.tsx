import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ProfileEditor from "./_components/profile-editor/profile-editor";

export default async function PerfilPage() {
  const session = await auth();
  if (!session) {
    return redirect("/");
  }

  return (
    <div className="space-y-4">
      <h1 className="mt-1 text-xl font-semibold">Perfil</h1>

      <div className="mx-auto max-w-xl">
        <ProfileEditor user={session.user} />
      </div>
    </div>
  );
}
