"use client";

import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import type { List, Template } from "@/app/_data/list";
import type { Project } from "@/app/_data/project";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ModalForm from "@/components/ui/modal-form";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/session";
import { importTemplates } from "./actions";
import TemplatePreview from "./template-preview";

export default function ImportTemplatesModal({
  list,
  templates,
  trigger,
}: {
  list: List;
  templates: Template[];
  trigger: React.ReactNode;
}) {
  const [selected, setSelected] = useState<boolean[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<
    Record<string, Template["items"]>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const { project } = useProjects();
  const { data: session } = useSession();
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (!project) {
      return;
    }

    const itemsByCategory: Record<string, Template["items"]> = {};
    for (const template of templates.filter((_t, idx) => selected[idx])) {
      for (const item of template.items) {
        const category = item.category
          ? getCategoryName(item.category, project, tCommon("noCategory"))
          : "";
        if (!itemsByCategory[category]) {
          itemsByCategory[category] = [];
        }

        itemsByCategory[category].push(item);
      }
    }
    setItemsByCategory(itemsByCategory);
  }, [selected, templates, project, tCommon]);

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
      toast.error(t("importError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!project) {
    return null;
  }

  return (
    <ModalForm
      trigger={trigger}
      title={t("importTitle")}
      description={t("importDescription")}
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
          <h3 className="font-semibold">{t("importPreview")}</h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {!itemsByCategory || Object.keys(itemsByCategory).length === 0 ? (
            <div className="text-muted-foreground italic">
              {tCommon("noItems")}
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
                          {category === "" ? tCommon("noCategory") : category}
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
        {submitting && <Spinner />}
        {t("importButton")}
      </Button>
    </ModalForm>
  );
}

function getCategoryName(
  categoryId: string,
  project: Project,
  noCategoryLabel: string,
) {
  if (categoryId === "") {
    return noCategoryLabel;
  }

  return (
    project.categories.find((c) => c.id === categoryId)?.name ?? noCategoryLabel
  );
}
