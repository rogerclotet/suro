"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import type { Event } from "@/app/_data/event";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import ModalForm from "@/components/ui/modal-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitButton from "@/components/ui/submit-button";
import { captureException } from "@/lib/error-reporting";
import { linkEventListSchema } from "../../_components/event/data";

export default function LinkListForm({
  event,
  trigger,
}: {
  event: Event;
  trigger: React.ReactNode;
}) {
  const t = useTranslations("calendar");
  const form = useForm({
    defaultValues: {
      listId: "",
    },
    resolver: valibotResolver(linkEventListSchema),
  });
  const { isAuthenticated } = useConvexAuth();
  const lists = useQuery(
    api.events.listLinkCandidates,
    isAuthenticated ? { projectId: event.projectId as Id<"projects"> } : "skip",
  );
  const linkList = useMutation(api.events.linkList);

  const onSubmit = useCallback(
    async (data: v.InferInput<typeof linkEventListSchema>) => {
      try {
        await linkList({
          eventId: event.id as Id<"events">,
          listId: data.listId as Id<"lists">,
        });
        toast.success(t("linkListSuccess"));
      } catch (e) {
        captureException(e, { action: "link_event_list" });
        toast.error(t("linkListError"));
      }
    },
    [event, t, linkList],
  );

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void form.handleSubmit(onSubmit)(e);
    },
    [form, onSubmit],
  );

  return (
    <ModalForm
      trigger={trigger}
      title={t("linkListTitle")}
      description={t("linkListDescription")}
    >
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="listId"
            render={({ field }) => {
              return (
                <FormItem>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger disabled={!lists || lists.length === 0}>
                        <SelectValue
                          placeholder={
                            lists && lists.length > 0
                              ? t("linkListPlaceholder")
                              : t("linkListNoLists")
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lists?.map((list) => (
                        <SelectItem key={list._id} value={list._id}>
                          {list.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              );
            }}
          />

          <SubmitButton
            text={t("linkListButton")}
            icon={<LinkIcon />}
            formState={form.formState}
          />
        </form>
      </Form>
    </ModalForm>
  );
}
