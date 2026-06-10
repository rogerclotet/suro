import { redirect } from "next/navigation";
import { fetchMe } from "@/lib/convex/server";
import ProfileEditor from "./_components/profile-editor/profile-editor";

export default async function PerfilPage() {
  const me = await fetchMe();
  if (!me) {
    return redirect("/");
  }

  return (
    <ProfileEditor
      user={{
        id: me._id,
        name: me.name ?? null,
        email: me.email ?? "",
        image: me.image ?? null,
        customImage: me.customImage ?? null,
        avatarColor: me.avatarColor ?? null,
        dateLocale: me.dateLocale ?? null,
        locale: me.locale ?? null,
      }}
    />
  );
}
