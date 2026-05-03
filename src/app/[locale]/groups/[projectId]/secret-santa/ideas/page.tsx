import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getPathname } from "@/i18n/navigation";
import { getCurrentSecretSanta } from "@/server/secret-santa";
import GiftIdeas from "./gift-ideas";

export default async function IdeasPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const t = await getTranslations("secretSanta");

  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const locale = await getLocale();
  const secretSantaPath = getPathname({
    href: {
      pathname: "/groups/[projectId]/secret-santa",
      params: { projectId },
    },
    locale,
  });

  const secretSanta = await getCurrentSecretSanta(projectId);
  if (!secretSanta) {
    redirect(secretSantaPath);
  }

  const participant = secretSanta!.participants.find(
    (p) => p.userId === session!.user.id,
  );
  if (!participant) {
    redirect(secretSantaPath);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-2xl">{t("ideasTitle")}</h2>

      <GiftIdeas
        giftIdeas={participant!.giftIdeas}
        secretSantaId={secretSanta!.id}
      />
    </div>
  );
}
