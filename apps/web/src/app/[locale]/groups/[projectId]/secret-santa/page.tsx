import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Secret Santa is disabled until it is ported to Convex. The nav entry is
// hidden (project.features.secretSanta is false); this stub covers deep links.
export default async function SecretSantaPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const t = await getTranslations("secretSanta");

  return (
    <Alert className="mx-auto max-w-lg">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>{t("comingSoonTitle")}</AlertTitle>
      <AlertDescription>{t("comingSoon")}</AlertDescription>
    </Alert>
  );
}
