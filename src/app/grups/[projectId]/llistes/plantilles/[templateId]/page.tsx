import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { checkAuth } from "@/lib/check-auth";
import { textToHtml } from "@/lib/utils";
import { getTemplate } from "@/server/lists";
import { LayoutTemplate } from "lucide-react";
import Link from "next/link";
import SettingsMenu from "../_components/settings/settings-menu";
import TemplateItems from "./_components/template-items";

export default async function TemplatePage({
  params: { projectId, templateId },
}: {
  params: { projectId: string; templateId: string };
}) {
  await checkAuth();

  const template = await getTemplate(templateId);
  if (!template) {
    return (
      <div className="space-y-4">
        <div className="alert alert-error">{"No s'ha trobat la plantilla"}</div>
        <Link href="/" className="btn btn-neutral">
          Tornar a la pàgina principal
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/grups/${projectId}/llistes`}>Llistes</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/grups/${projectId}/llistes/plantilles`}>
                Plantilles
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{template.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <LayoutTemplate /> {template.name}
        </h1>
        <SettingsMenu template={template} />
      </div>

      {template.description && (
        <p
          dangerouslySetInnerHTML={{
            __html: textToHtml(template.description),
          }}
          className="pb-6"
        />
      )}

      <TemplateItems template={template} />
    </div>
  );
}
