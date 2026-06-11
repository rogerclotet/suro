"use client";

import {
  Link2,
  ListPlus,
  ListTodo,
  NotebookPen,
  NotebookText,
  PiggyBank,
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
import type { LinkedNote, LinkedPot } from "@/lib/queries/use-events";
import LinkListForm from "./link-list-form";
import LinkNoteForm from "./link-note-form";
import LinkPotForm from "./link-pot-form";
import { useCreateLinked } from "./use-create-linked";

// Quieter than the regular outline button: a dashed, muted pill, so the
// prompts fill the empty space without competing with real content.
const CHIP_CLASSES =
  "h-7 gap-1.5 rounded-full border-dashed px-3 font-normal text-muted-foreground text-xs shadow-none hover:text-foreground";

/**
 * Low-prominence prompts surfacing the settings menu's add-to-event actions
 * for whichever kinds the event is still missing, so they're discoverable
 * without opening the menu. (No file chip: the always-visible Files section
 * already carries an upload button.)
 */
export default function AddToEventChips({
  event,
  list,
  note,
  pot,
  canCreatePot,
}: {
  event: Event;
  list: List | null;
  note: LinkedNote | null;
  pot: LinkedPot | null;
  canCreatePot: boolean;
}) {
  const t = useTranslations("calendar");
  const {
    handleCreateLinkedList,
    handleCreateLinkedNote,
    handleCreateLinkedPot,
  } = useCreateLinked(event);

  const missingList = list === null;
  const missingNote = note === null;
  const missingPot = pot === null && canCreatePot;
  if (!missingList && !missingNote && !missingPot) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {missingList && (
        <Button
          variant="outline"
          size="sm"
          className={CHIP_CLASSES}
          onClick={handleCreateLinkedList}
        >
          <ListPlus />
          {t("addListChip")}
        </Button>
      )}
      {missingNote && (
        <Button
          variant="outline"
          size="sm"
          className={CHIP_CLASSES}
          onClick={handleCreateLinkedNote}
        >
          <NotebookPen />
          {t("addNoteChip")}
        </Button>
      )}
      {missingPot && (
        <Button
          variant="outline"
          size="sm"
          className={CHIP_CLASSES}
          onClick={handleCreateLinkedPot}
        >
          <PiggyBank />
          {t("addPotChip")}
        </Button>
      )}
      <ResponsiveMenu>
        <ResponsiveMenuTrigger>
          <Button variant="outline" size="sm" className={CHIP_CLASSES}>
            <Link2 />
            {t("linkExistingChip")}
          </Button>
        </ResponsiveMenuTrigger>
        <ResponsiveMenuContent title={t("linkExistingChip")}>
          {missingList && (
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
          )}
          {missingNote && (
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
          )}
          {missingPot && (
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
          )}
        </ResponsiveMenuContent>
      </ResponsiveMenu>
    </div>
  );
}
