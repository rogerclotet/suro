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
import { useTranslations } from "next-intl";
import type { Event } from "@/app/_data/event";
import type { List } from "@/app/_data/list";
import { Button } from "@/components/ui/button";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuTrigger,
} from "@/components/ui/responsive-menu";
import CreateEventPotForm from "./create-event-pot-form";
import DeleteEventModal from "./delete-event-modal";
import EditEventForm from "./edit-event-form";
import LinkListForm from "./link-list-form";
import LinkNoteForm from "./link-note-form";
import LinkPotForm from "./link-pot-form";
import UnlinkEventListModal from "./unlink-event-list-modal";
import UnlinkEventPotModal from "./unlink-event-pot-modal";
import { useCreateLinked } from "./use-create-linked";

export default function SettingsMenu({
  event,
  list,
  pot,
  canCreatePot,
}: {
  event: Event;
  list: List | null;
  pot: { id: string } | null;
  canCreatePot: boolean;
}) {
  const t = useTranslations("calendar");
  const { handleCreateLinkedList, handleCreateLinkedNote } =
    useCreateLinked(event);

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
        {list === null ? (
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

        {pot !== null ? (
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
              <CreateEventPotForm
                event={event}
                trigger={
                  <ResponsiveMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer gap-2"
                  >
                    <PiggyBank />
                    {t("createPotMenuItem")}
                  </ResponsiveMenuItem>
                }
              />

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
