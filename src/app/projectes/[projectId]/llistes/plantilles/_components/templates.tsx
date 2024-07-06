import { auth } from "@/auth";
import { getTemplates } from "@/server/lists";
import { CornerRightUp } from "lucide-react";
import { redirect } from "next/navigation";
import TemplatePreview from "./template-preview";

export default async function Templates({ projectId }: { projectId: string }) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const templates = await getTemplates(projectId);

  if (templates.length === 0) {
    return (
      <div className="flex flex-row items-center justify-end gap-4 pr-8 text-right md:pr-14">
        Encara no hi ha plantilles, pots crear-ne una aquí{" "}
        <CornerRightUp className="mb-4 flex-shrink-0" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <TemplatePreview key={template.id} template={template} />
      ))}
    </div>
  );
}
