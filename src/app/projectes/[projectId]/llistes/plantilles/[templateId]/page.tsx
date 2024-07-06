import { checkAuth } from "@/lib/check-auth";
import { getTemplate } from "@/server/lists";
import Link from "next/link";

export default async function TemplatePage({
  params: { templateId },
}: {
  params: { templateId: string };
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">{template.name}</h1>
      </div>

      {template.description && (
        <p
          dangerouslySetInnerHTML={{
            __html: template.description.replaceAll("\n", "<br/>"),
          }}
          className="pb-6"
        />
      )}
    </div>
  );
}
