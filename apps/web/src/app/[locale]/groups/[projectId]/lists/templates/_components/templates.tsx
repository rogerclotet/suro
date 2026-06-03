import { Info } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getTemplates } from "@/server/lists";
import TemplatePreview from "./template-preview";

export default async function Templates({ projectId }: { projectId: string }) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const templates = await getTemplates(projectId);
  const t = await getTranslations("templates");

  if (templates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-muted-foreground">
          <Description>
            <p className="mt-4 text-muted-foreground">{t("empty")}</p>
          </Description>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Description />
      </div>
      <div className="columns-1 gap-2 space-y-2 sm:columns-2 xl:columns-3">
        {templates.map((template) => (
          <TemplatePreview key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}

async function Description({ children }: { children?: React.ReactNode }) {
  const t = await getTranslations("templates");
  const tCommon = await getTranslations("common");

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>{tCommon("info")}</AlertTitle>
      <AlertDescription className="space-y-2">
        {children}
        <p>{t("description")}</p>
      </AlertDescription>
    </Alert>
  );
}
