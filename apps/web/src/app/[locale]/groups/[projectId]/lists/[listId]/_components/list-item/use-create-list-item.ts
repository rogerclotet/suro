"use client";

import { api } from "backend/convex/_generated/api";
import type { Doc, Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { List } from "@/app/_data/list";
import { useSession } from "@/lib/session";

/**
 * Create-item logic shared by every inline add row: duplicate check, optimistic
 * insert, and fire-and-forget submission with error reporting. The optimistic
 * insert makes a brand-new category section mount in the same commit as the
 * caller's focus-follow state change, so its input can grab focus immediately.
 */
export default function useCreateListItem(
  list: List,
  onError: (lostName: string) => void,
): { submit: (name: string, category: string | null) => boolean } {
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
      };

      // CheckList is fed by `listByProject` on the lists page and by
      // `events.get` on the event page; patch whichever is subscribed.
      const projectId = list.projectId as Id<"projects">;
      const lists = store.getQuery(api.lists.listByProject, { projectId });
      if (lists) {
        store.setQuery(
          api.lists.listByProject,
          { projectId },
          lists.map((l) =>
            l._id === args.listId ? { ...l, items: [...l.items, tempItem] } : l,
          ),
        );
      }

      if (list.eventId) {
        const eventId = list.eventId as Id<"events">;
        const event = store.getQuery(api.events.get, { eventId });
        if (event?.list) {
          store.setQuery(
            api.events.get,
            { eventId },
            {
              ...event,
              list: { ...event.list, items: [...event.list.items, tempItem] },
            },
          );
        }
      }
    },
  );

  function submit(name: string, category: string | null): boolean {
    if (list.items.some((i) => i.category === category && i.name === name)) {
      toast.error(t("itemAlreadyExists"));
      return false;
    }

    // Let the mutation race in the background: awaiting it would disable the
    // input mid-flight, which blurs it and closes the mobile keyboard between
    // consecutive adds.
    createItem({
      listId: list.id as Id<"lists">,
      name,
      category,
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
