"use client";

import {
  Edit,
  ListPlus,
  ListTodo,
  ListX,
  Settings,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useRef } from "react";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createLinkedList } from "../actions";
import DeleteEventModal from "./delete-event-modal";
import EditEventForm from "./edit-event-form";
import LinkListForm from "./link-list-form";
import UnlinkEventListModal from "./unlink-event-list-modal";

export default function SettingsMenu({
  event,
  list,
}: {
  event: Event;
  list: List | undefined;
}) {
  const { data: session } = useSession();
  const editDialogRef = useRef<HTMLButtonElement>(null);
  const deleteDialogRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("calendar");

  async function handleCreateLinkedList() {
    try {
      await createLinkedList(event);
      toast.success(t("createListSuccess"));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_event_list",
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(t("createListError"));
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <EditEventForm
          event={event}
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => editDialogRef.current?.click()}
              className="cursor-pointer gap-2"
            >
              <Edit />
              {t("editTitle")}
            </DropdownMenuItem>
          }
        />
        {list === undefined ? (
          <>
            <DropdownMenuItem
              onClick={handleCreateLinkedList}
              className="cursor-pointer gap-2"
            >
              <ListPlus />
              {t("createListMenuItem")}
            </DropdownMenuItem>

            <LinkListForm
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer gap-2"
                >
                  <ListTodo />
                  {t("linkExistingListMenuItem")}
                </DropdownMenuItem>
              }
              event={event}
            />
          </>
        ) : (
          <UnlinkEventListModal
            trigger={
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer gap-2"
              >
                <ListX />
                {t("unlinkListButton")}
              </DropdownMenuItem>
            }
            event={event}
            list={list}
          />
        )}

        <DeleteEventModal
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => deleteDialogRef.current?.click()}
              className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 />
              {t("deleteTitle")}
            </DropdownMenuItem>
          }
          event={event}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
