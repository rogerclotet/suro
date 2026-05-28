import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { getUserProject } from "@/server/projects";
import FeaturesForm from "./_components/features-form";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const { projectId } = await params;
  const project = await getUserProject(projectId);
  if (!project) {
    redirect("/");
  }

  if (project.createdBy !== session.user.id) {
    redirect(`/groups/${projectId}/lists`);
  }

  const t = await getTranslations("groupSettings");

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <header className="space-y-1">
        <h1 className="font-semibold text-2xl">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">{t("featuresTitle")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("featuresDescription")}
        </p>
        <FeaturesForm project={project} />
      </section>
    </div>
  );
}
