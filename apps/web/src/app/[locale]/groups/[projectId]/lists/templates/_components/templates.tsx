"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProjectTemplates } from "@/lib/queries/use-project-lists";
import TemplatePreview, { TemplatePreviewSkeleton } from "./template-preview";

export default function Templates({ projectId }: { projectId: string }) {
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  const templates = useProjectTemplates(projectId);

  if (templates === undefined) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <TemplatePreviewSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{tCommon("info")}</AlertTitle>
        <AlertDescription className="space-y-2">
          {templates.length === 0 && (
            <p className="mt-4 text-muted-foreground">{t("empty")}</p>
          )}
          <p>{t("description")}</p>
        </AlertDescription>
      </Alert>

      {templates.length > 0 && (
        <div className="columns-1 gap-2 space-y-2 sm:columns-2 xl:columns-3">
          {templates.map((template) => (
            <TemplatePreview key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
