import { AlertCircle, ArrowLeft, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { checkAuth } from "@/lib/check-auth";
import { textToHtml } from "@/lib/utils";
import { getTemplate } from "@/server/lists";
import SettingsMenu from "../_components/settings/settings-menu";
import TemplateItems from "./_components/template-items";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ projectId: string; templateId: string }>;
}) {
  await checkAuth();

  const { projectId, templateId } = await params;

  const template = await getTemplate(templateId);
  if (!template) {
    return (
      <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>{"No s'ha trobat la plantilla."}</p>
            <div className="mt-4">
              <Link href="/">
                <Button variant="neutral" className="gap-2">
                  <ArrowLeft />
                  {"Tornar a l'inici"}
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
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
        <h1 className="flex items-center gap-2 font-semibold text-xl">
          <LayoutTemplate /> {template.name}
        </h1>
        <SettingsMenu template={template} />
      </div>

      {template.description && (
        <p
          // biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe because the description is sanitized
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
