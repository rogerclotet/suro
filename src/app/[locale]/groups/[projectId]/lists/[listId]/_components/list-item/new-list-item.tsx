"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { List } from "@/app/_data/list";
import { useProjects } from "@/app/_state/project-state";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { createListItemOffline } from "@/lib/offline/offline-actions";
import NewCategoryModal from "../categories/new-category-modal";
import { listItemSchema } from "./data";

export default function NewListItem({ list }: { list: List }) {
  const form = useForm({
    defaultValues: {
      name: "",
      completed: false,
      categoryId: "",
    },
    resolver: valibotResolver(listItemSchema),
  });
  const { project } = useProjects();
  const { data: session } = useSession();
  const newListModalRef = useRef<HTMLButtonElement>(null);
  const [submitCount, setSubmitCount] = useState(0);
  const t = useTranslations("lists");
  const tCommon = useTranslations("common");

  async function onSubmit(data: v.InferInput<typeof listItemSchema>) {
    if (data.name === "") {
      return;
    }

    if (data.categoryId === "") {
      data.categoryId = null;
    }

    if (
      list.items.find(
        (i) => i.categoryId === data.categoryId && i.name === data.name,
      )
    ) {
      toast.error(t("itemAlreadyExists"));
      return;
    }

    try {
      const categoryName = project?.categories.find(
        (c) => c.id === data.categoryId,
      )?.name;
      await createListItemOffline(list, data, categoryName);
      form.reset({
        name: "",
        completed: false,
        categoryId: data.categoryId ?? "",
      });
      setSubmitCount((c) => c + 1);
    } catch (e) {
      console.error("[new-list-item] createListItemOffline failed:", e);
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_list_item",
        projectId: list.projectId,
        listId: list.id,
      });
      toast.error(t("itemCreateError"));
      return;
    }
  }

  function handleCategoryChange(value: string) {
    if (value === "new") {
      newListModalRef.current?.click();
      return;
    }

    if (value === "-") {
      form.setValue("categoryId", "");
    } else {
      form.setValue("categoryId", value);
    }
  }

  return (
    <li className="flex w-full items-center justify-between gap-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex grow flex-col gap-2 sm:flex-row sm:items-start"
        >
          {/* Input + confirm button — always a row */}
          <div className="flex grow items-start gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grow">
                  <FormControl>
                    <Input
                      key={submitCount}
                      placeholder={t("newItemPlaceholder")}
                      disabled={form.formState.isSubmitting}
                      className="h-10"
                      autoFocus={submitCount > 0}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.formState.isDirty && (
              <Button
                size="icon"
                variant="ghost"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? <Spinner /> : <Check />}
              </Button>
            )}
          </div>

          {/* Category — full width below on mobile, fixed width beside on sm+ */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <Select
                  value={field.value ?? undefined}
                  onValueChange={handleCategoryChange}
                  disabled={form.formState.isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder={tCommon("noCategory")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="-">{tCommon("noCategory")}</SelectItem>
                    {project?.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}

                    <SelectItem value="new">{t("newCategory")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      <NewCategoryModal
        trigger={
          <button ref={newListModalRef} type="button" className="hidden" />
        }
        onCreate={(categoryId) => form.setValue("categoryId", categoryId)}
      />
    </li>
  );
}
