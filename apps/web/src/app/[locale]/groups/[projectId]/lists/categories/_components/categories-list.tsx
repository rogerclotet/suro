"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Category from "./category";

export default function CategoriesList({ projectId }: { projectId: string }) {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const data = useQuery(api.categories.listWithCounts, {
    projectId: projectId as Id<"projects">,
  });

  if (data === undefined) {
    return null;
  }

  const categories = data.map((c) => ({
    id: c._id,
    name: c.name,
    projectId: c.projectId,
    itemCount: c.itemCount,
  }));

  return (
    <>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{tCommon("info")}</AlertTitle>
        <AlertDescription className="space-y-2">
          {categories.length === 0 && (
            <p className="mt-4 text-muted-foreground">{t("empty")}</p>
          )}
          <p>{t("description")}</p>
        </AlertDescription>
      </Alert>

      {categories.length > 0 && (
        <ul className="mx-auto max-w-xl space-y-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Category category={category} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
