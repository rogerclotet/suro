"use client";

import {
  Edit,
  ListPlus,
  ListTodo,
  ListX,
  NotebookPen,
  NotebookText,
  PiggyBank,
  Receipt,
  Settings,
  Trash2,
  Wallet,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useRef } from "react";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import type { Pot } from "@/app/_data/pot";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createLinkedList,
  createLinkedNote,
  createLinkedPot,
} from "../actions";
import DeleteEventModal from "./delete-event-modal";
import EditEventForm from "./edit-event-form";
import LinkListForm from "./link-list-form";
import LinkNoteForm from "./link-note-form";
import LinkPotForm from "./link-pot-form";
import UnlinkEventListModal from "./unlink-event-list-modal";
import UnlinkEventPotModal from "./unlink-event-pot-modal";

export default function SettingsMenu({
  event,
  list,
  pot,
  canCreatePot,
}: {
  event: Event;
  list: List | undefined;
  pot: Pot | undefined;
  canCreatePot: boolean;
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

  async function handleCreateLinkedNote() {
    try {
      await createLinkedNote(event);
      toast.success(t("createNoteSuccess"));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_event_note",
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(t("createNoteError"));
    }
  }

  async function handleCreateLinkedPot() {
    try {
      await createLinkedPot(event);
      toast.success(t("createPotSuccess"));
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "create_event_pot",
        projectId: event.projectId,
        eventId: event.id,
      });
      toast.error(t("createPotError"));
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

        <DropdownMenuItem
          onClick={handleCreateLinkedNote}
          className="cursor-pointer gap-2"
        >
          <NotebookPen />
          {t("createNoteMenuItem")}
        </DropdownMenuItem>
        <LinkNoteForm
          trigger={
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <NotebookText />
              {t("linkExistingNoteMenuItem")}
            </DropdownMenuItem>
          }
          event={event}
        />

        {pot !== undefined ? (
          <UnlinkEventPotModal
            trigger={
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer gap-2"
              >
                <Receipt />
                {t("unlinkPotButton")}
              </DropdownMenuItem>
            }
            event={event}
            pot={pot}
          />
        ) : (
          canCreatePot && (
            <>
              <DropdownMenuItem
                onClick={handleCreateLinkedPot}
                className="cursor-pointer gap-2"
              >
                <PiggyBank />
                {t("createPotMenuItem")}
              </DropdownMenuItem>

              <LinkPotForm
                trigger={
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer gap-2"
                  >
                    <Wallet />
                    {t("linkExistingPotMenuItem")}
                  </DropdownMenuItem>
                }
                event={event}
              />
            </>
          )
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
