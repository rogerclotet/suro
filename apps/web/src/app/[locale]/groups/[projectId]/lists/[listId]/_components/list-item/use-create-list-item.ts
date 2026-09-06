"use client";

import { api } from "backend/convex/_generated/api";
import type { Doc, Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { List } from "@/app/_data/list";
import { updateListItems } from "@/lib/queries/update-list-items";
import { useSession } from "@/lib/session";
import type { TaskMutationArgs } from "./data";

/**
 * Create-item logic shared by every inline add row: duplicate check (reopening
 * a completed match instead of erroring), optimistic insert, and fire-and-forget
 * submission with error reporting. The optimistic insert makes a brand-new
 * category section mount in the same commit as the caller's focus-follow state
 * change, so its input can grab focus immediately.
 */
export default function useCreateListItem(
  list: List,
  onError: (lostName: string) => void,
): {
  submit: (
    name: string,
    category: string | null,
    task?: TaskMutationArgs,
  ) => boolean;
} {
  const { data: session } = useSession();
  const t = useTranslations("lists");

  const createItem = useMutation(api.listItems.create).withOptimisticUpdate(
    (store, args) => {
      const tempItem: Doc<"listItems"> = {
        // Placeholder identity; Convex swaps in the server row on completion.
        _id: crypto.randomUUID() as Id<"listItems">,
        _creationTime: Date.now(),
        name: args.name,
        completed: false,
        listId: args.listId,
        category: args.category ?? undefined,
        createdBy: (session?.user.id ?? "") as Id<"users">,
        updatedAt: Date.now(),
        dueAt: args.dueAt,
        dueAllDay: args.dueAllDay,
        assigneeId: args.assigneeId,
        priority: args.priority,
        recurrence: args.recurrence,
      };

      updateListItems(store, list, (items) => [...items, tempItem]);
    },
  );

  const updateItem = useMutation(
    api.listItems.setCompleted,
  ).withOptimisticUpdate((store, args) => {
    updateListItems(store, list, (items) =>
      items.map((item) =>
        item._id === args.itemId
          ? { ...item, completed: args.completed, updatedAt: Date.now() }
          : item,
      ),
    );
  });

  function submit(
    name: string,
    category: string | null,
    task?: TaskMutationArgs,
  ): boolean {
    const matches = list.items.filter(
      (i) => i.category === category && i.name === name,
    );
    const pending = matches.find((i) => !i.completed);
    if (pending) {
      toast.error(t("itemAlreadyExists"));
      return false;
    }
    const completed = matches.find((i) => i.completed);
    if (completed) {
      updateItem({
        itemId: completed.id as Id<"listItems">,
        completed: false,
        expectedDueAt: completed.dueAt?.getTime() ?? null,
      }).catch((e: unknown) => {
        console.error("[use-create-list-item] reopen failed:", e);
        posthog.captureException(e, {
          distinctId: session?.user.id,
          action: "reopen_list_item",
          projectId: list.projectId,
          listId: list.id,
        });
        toast.error(t("itemUpdateError"));
      });
      return true;
    }

    // Let the mutation race in the background: awaiting it would disable the
    // input mid-flight, which blurs it and closes the mobile keyboard between
    // consecutive adds.
    createItem({
      listId: list.id as Id<"lists">,
      name,
      category,
      ...task,
    }).catch((e: unknown) => {
      console.error("[use-create-list-item] create failed:", e);
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_list_item",
        projectId: list.projectId,
        listId: list.id,
      });
      onError(name);
      toast.error(t("itemCreateError"));
    });
    return true;
  }

  return { submit };
}
