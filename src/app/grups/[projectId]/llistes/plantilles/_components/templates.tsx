import { CornerRightUp, Info } from "lucide-react";
import { redirect } from "next/navigation";
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

  if (templates.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-row items-center justify-end gap-4 pr-8 text-right md:pr-14">
          Encara no hi ha plantilles, pots crear-ne una aquí{" "}
          <CornerRightUp className="mb-4 flex-shrink-0" />
        </div>
        <div className="text-muted-foreground">
          <Description />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Description />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplatePreview key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}

function Description() {
  const description = `Les plantilles són llistes amb elements que s'inclouran a les llistes que les utilitzin. 
  Es poden utilitzar per parts d'una llista que es repeteixen freqüentment per poder crear llistes més ràpidament.`;

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Informació</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
