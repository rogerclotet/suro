"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import React, { Fragment } from "react";
import { toast } from "sonner";
import type { List, Template } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ModalForm from "@/components/ui/modal-form";
import { importTemplates } from "./actions";
import TemplatePreview from "./template-preview";

export default function ImportTemplatesModal({
  list,
  templates,
  triggerRef,
}: {
  list: List;
  templates: Template[];
  triggerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [selected, setSelected] = React.useState<boolean[]>([]);
  const [itemsByCategory, setItemsByCategory] = React.useState<
    Record<string, Template["items"]>
  >({});
  const [submitting, setSubmitting] = React.useState(false);
  const { project } = useProjects();
  const { data: session } = useSession();

  React.useEffect(() => {
    if (!project) {
      return;
    }

    const itemsByCategory: Record<string, Template["items"]> = {};
    for (const template of templates.filter((_t, idx) => selected[idx])) {
      for (const item of template.items) {
        const category = item.category
          ? getCategoryName(item.category, project)
          : "";
        if (!itemsByCategory[category]) {
          itemsByCategory[category] = [];
        }

        itemsByCategory[category].push(item);
      }
    }
    setItemsByCategory(itemsByCategory);
  }, [selected, templates, project]);

  function handleSelect(idx: number) {
    const newSelected = [...selected];
    newSelected[idx] = !newSelected[idx];
    setSelected(newSelected);
  }

  async function handleSubmit() {
    if (!project) {
      return;
    }

    setSubmitting(true);

    try {
      await importTemplates(
        project,
        list.id,
        Object.values(itemsByCategory).flat(),
      );
      triggerRef.current?.click();
      setSelected([]);
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "import_templates_to_existing_list",
        projectId: project.id,
        listId: list.id,
        templateIds: templates
          .filter((_t, idx) => selected[idx])
          .map((t) => t.id),
      });
      toast.error(
        "No s'han pogut importar les plantilles, torna-ho a provar més tard",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!project) {
    return null;
  }

  return (
    <ModalForm
      triggerRef={triggerRef}
      title="Importar plantilles"
      description="Importar els elements de les plantilles seleccionades a la llista actual"
    >
      <ul className="space-y-2">
        {templates.map((template, idx) => (
          <li key={template.id}>
            <TemplatePreview
              template={template}
              onChange={() => handleSelect(idx)}
            />
          </li>
        ))}
      </ul>

      <Card className="bg-background">
        <CardHeader className="p-4">
          <h3 className="font-semibold">
            Previsualització dels elements afegits
          </h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {!itemsByCategory || Object.keys(itemsByCategory).length === 0 ? (
            <div className="italic text-muted-foreground">
              No hi ha elements
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {Object.entries(itemsByCategory)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([category, items]) => {
                  const sortedItems = items.sort((a, b) =>
                    a.name.localeCompare(b.name),
                  );
                  return (
                    <Fragment key={category}>
                      <li>
                        <h4 className="font-semibold">
                          {category === "" ? "Sense categoria" : category}
                        </h4>
                      </li>

                      <li>{sortedItems.map((item) => item.name).join(", ")}</li>
                    </Fragment>
                  );
                })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={submitting || selected.every((s) => !s)}
        className="space-x-2"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Importar plantilles seleccionades
      </Button>
    </ModalForm>
  );
}

function getCategoryName(categoryId: string, project: Project) {
  if (categoryId === "") {
    return "Sense categoria";
  }

  return (
    project.categories.find((c) => c.id === categoryId)?.name ??
    "Sense categoria"
  );
}
