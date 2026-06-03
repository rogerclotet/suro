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
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import type { Pot } from "@/app/_data/pot";
import { Button } from "@/components/ui/button";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu";
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
    <ResponsiveMenu>
      <ResponsiveMenuTrigger>
        <Button variant="ghost" size="icon">
          <Settings />
        </Button>
      </ResponsiveMenuTrigger>
      <ResponsiveMenuContent>
        <EditEventForm
          event={event}
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <Edit />
              {t("editTitle")}
            </ResponsiveMenuItem>
          }
        />
        {list === undefined ? (
          <>
            <ResponsiveMenuItem
              onClick={handleCreateLinkedList}
              className="cursor-pointer gap-2"
            >
              <ListPlus />
              {t("createListMenuItem")}
            </ResponsiveMenuItem>

            <LinkListForm
              trigger={
                <ResponsiveMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="cursor-pointer gap-2"
                >
                  <ListTodo />
                  {t("linkExistingListMenuItem")}
                </ResponsiveMenuItem>
              }
              event={event}
            />
          </>
        ) : (
          <UnlinkEventListModal
            trigger={
              <ResponsiveMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer gap-2"
              >
                <ListX />
                {t("unlinkListButton")}
              </ResponsiveMenuItem>
            }
            event={event}
            list={list}
          />
        )}

        <ResponsiveMenuItem
          onClick={handleCreateLinkedNote}
          className="cursor-pointer gap-2"
        >
          <NotebookPen />
          {t("createNoteMenuItem")}
        </ResponsiveMenuItem>
        <LinkNoteForm
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2"
            >
              <NotebookText />
              {t("linkExistingNoteMenuItem")}
            </ResponsiveMenuItem>
          }
          event={event}
        />

        {pot !== undefined ? (
          <UnlinkEventPotModal
            trigger={
              <ResponsiveMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer gap-2"
              >
                <Receipt />
                {t("unlinkPotButton")}
              </ResponsiveMenuItem>
            }
            event={event}
            pot={pot}
          />
        ) : (
          canCreatePot && (
            <>
              <ResponsiveMenuItem
                onClick={handleCreateLinkedPot}
                className="cursor-pointer gap-2"
              >
                <PiggyBank />
                {t("createPotMenuItem")}
              </ResponsiveMenuItem>

              <LinkPotForm
                trigger={
                  <ResponsiveMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer gap-2"
                  >
                    <Wallet />
                    {t("linkExistingPotMenuItem")}
                  </ResponsiveMenuItem>
                }
                event={event}
              />
            </>
          )
        )}

        <DeleteEventModal
          trigger={
            <ResponsiveMenuItem
              onSelect={(e) => e.preventDefault()}
              className="cursor-pointer gap-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 />
              {t("deleteTitle")}
            </ResponsiveMenuItem>
          }
          event={event}
        />
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}
