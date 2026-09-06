"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useConvexAuth, useQuery } from "convex/react";
import { PencilIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback } from "react";
import Action from "@/components/action";
import { ClientOnly } from "@/components/client-only";
import {
  htmlToPreview,
  RichTextContent,
} from "@/components/ui/rich-text-content";
import ShareButton from "@/components/ui/share-button";
import { useRouter } from "@/i18n/navigation";
import { formatRelative } from "@/lib/format-relative";
import { useNote } from "@/lib/queries/use-notes";
import SettingsMenu from "./settings-menu";

/**
 * The note reading view: the rendered (sanitized) note with working links. The
 * editor lives one route deeper, reached through the FAB, so tapping a note
 * never drops the reader into an editing surface.
 */
export default function NoteView({ noteId }: { noteId: string }) {
  const note = useNote(noteId);
  const { isAuthenticated } = useConvexAuth();
  const lock = useQuery(
    api.noteEditLocks.get,
    isAuthenticated
      ? {
          noteId: noteId as Id<"notes">,
        }
      : "skip",
  );
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("notes");
  const tCommon = useTranslations("common");

  const projectId = note?.projectId;
  const edit = useCallback(() => {
    if (!projectId || lock !== null) return;
    router.push({
      pathname: "/groups/[projectId]/notes/[noteId]/edit",
      params: { projectId, noteId },
    });
  }, [router, projectId, noteId, lock]);

  if (note === undefined || note === null) {
    return null;
  }

  const updatedAt = note.updatedAt ?? note.createdAt;
  const isEmpty = htmlToPreview(note.format, note.contents).trim() === "";

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="break-words font-semibold text-xl">{note.name}</h1>
          {updatedAt && (
            <p className="mt-1 text-muted-foreground/70 text-xs">
              {formatRelative(updatedAt, locale)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ClientOnly>
            <ShareButton
              title={note.name}
              text=""
              href={{
                pathname: "/groups/[projectId]/notes/[noteId]",
                params: { projectId: note.projectId, noteId: note.id },
              }}
            />
          </ClientOnly>
          <SettingsMenu note={note} />
        </div>
      </div>

      {lock && (
        <p role="status" className="text-muted-foreground text-sm">
          {lock.editorName
            ? t("editingBy", { name: lock.editorName })
            : t("editingBySomeone")}
        </p>
      )}
      {isEmpty ? (
        <p className="text-muted-foreground/50 italic">{t("emptyPreview")}</p>
      ) : (
        <RichTextContent
          format={note.format}
          content={note.contents}
          className="min-h-0 flex-1"
        />
      )}

      <Action
        label={tCommon("edit")}
        icon={PencilIcon}
        onClick={edit}
        disabled={lock !== null}
      />
    </div>
  );
}
