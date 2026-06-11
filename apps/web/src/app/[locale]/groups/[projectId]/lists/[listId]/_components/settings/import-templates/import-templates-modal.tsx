"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import type { List, Template } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ModalForm, { useModalForm } from "@/components/ui/modal-form";
import { useOptionalResponsiveMenu } from "@/components/ui/responsive-menu";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/session";
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
  const t = useTranslations("templates");

  return (
    <ModalForm
      trigger={trigger}
      title={t("importTitle")}
      description={t("importDescription")}
    >
      {/* Split out so the form can reach the modal context's close(). */}
      <ImportTemplatesContent list={list} templates={templates} />
    </ModalForm>
  );
}

function ImportTemplatesContent({
  list,
  templates,
}: {
  list: List;
  templates: Template[];
}) {
  const [selected, setSelected] = useState<boolean[]>([]);
  const [itemsByCategory, setItemsByCategory] = useState<
    Record<string, Template["items"]>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const { project } = useProjects();
  const { data: session } = useSession();
  const { close } = useModalForm();
  const menu = useOptionalResponsiveMenu();
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  const importTemplates = useMutation(api.lists.importTemplates);

  useEffect(() => {
    const itemsByCategory: Record<string, Template["items"]> = {};
    for (const template of templates.filter((_t, idx) => selected[idx])) {
      for (const item of template.items) {
        const category = item.category ?? "";
        if (!itemsByCategory[category]) {
          itemsByCategory[category] = [];
        }

        itemsByCategory[category].push(item);
      }
    }
    setItemsByCategory(itemsByCategory);
  }, [selected, templates]);

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
      const templateIds = templates
        .filter((_t, idx) => selected[idx])
        .map((tpl) => tpl.id as Id<"listTemplates">);
      await importTemplates({
        listId: list.id as Id<"lists">,
        templateIds,
      });
      setSelected([]);
      // Close the modal AND the settings menu beneath it (kept open by the
      // trigger item's preventDefault), so importing doesn't drop the user
      // back onto the menu sheet.
      close();
      menu?.setOpen(false);
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
    <>
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
    </>
  );
}
