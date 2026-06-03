"use client";

import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import posthog from "posthog-js";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type { Note } from "@/app/_data/note";
import { RichTextEditor } from "@/components/ui/rich-text-editor-lazy";
import { formatRelative } from "@/lib/format-relative";
import { updateNoteOffline } from "@/lib/offline/offline-notes";

type SaveState = "idle" | "saving" | "saved";

const AUTOSAVE_DELAY_MS = 800;
const SAVED_INDICATOR_MS = 2000;

export default function NoteEditor({
  note,
  actions,
  backlink,
}: {
  note: Note;
  actions?: ReactNode;
  backlink?: ReactNode;
}) {
  const { data: session } = useSession();
  const t = useTranslations("notes");
  const locale = useLocale();

  const [name, setName] = useState(note.name);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(
    note.updatedAt ?? note.createdAt ?? null,
  );

  // Refs hold the freshest values so the save logic stays referentially stable
  // and never fires spurious saves when the server revalidates the `note` prop.
  const noteRef = useRef(note);
  noteRef.current = note;
  const sessionIdRef = useRef(session?.user.id);
  sessionIdRef.current = session?.user.id;
  const tRef = useRef(t);
  tRef.current = t;

  const latestRef = useRef({ name: note.name, contents: note.contents });
  const lastSavedRef = useRef({ name: note.name, contents: note.contents });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async () => {
    const trimmedName = latestRef.current.name.trim();
    const { contents } = latestRef.current;

    // Never persist an empty title (matches the note schema's nonEmpty rule).
    if (trimmedName === "") return;
    if (
      trimmedName === lastSavedRef.current.name &&
      contents === lastSavedRef.current.contents
    ) {
      return;
    }

    setSaveState("saving");
    try {
      await updateNoteOffline(noteRef.current, {
        name: trimmedName,
        contents,
        format: "html",
      });
      lastSavedRef.current = { name: trimmedName, contents };
      setSavedAt(new Date());
      setSaveState("saved");
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
      savedResetRef.current = setTimeout(
        () => setSaveState("idle"),
        SAVED_INDICATOR_MS,
      );
    } catch (e) {
      posthog.captureException(e, {
        distinctId: sessionIdRef.current,
        action: "edit_note",
        projectId: noteRef.current.projectId,
        noteId: noteRef.current.id,
      });
      toast.error(tRef.current("editError"));
      setSaveState("idle");
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void save();
    }, AUTOSAVE_DELAY_MS);
  }, [save]);

  // Flush pending edits when the page is hidden, closed, or the editor unmounts.
  useEffect(() => {
    function flush() {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
        void save();
      }
    }
    function handleVisibility() {
      if (document.visibilityState === "hidden") flush();
    }

    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", handleVisibility);
      flush();
      if (savedResetRef.current) clearTimeout(savedResetRef.current);
    };
  }, [save]);

  function handleNameChange(value: string) {
    setName(value);
    latestRef.current.name = value;
    scheduleSave();
  }

  function handleContentsChange(html: string) {
    latestRef.current.contents = html;
    scheduleSave();
  }

  const statusLabel =
    saveState === "saving"
      ? t("saving")
      : saveState === "saved"
        ? t("saved")
        : savedAt
          ? formatRelative(savedAt, locale)
          : null;

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t("titlePlaceholder")}
            aria-label={t("titlePlaceholder")}
            className="w-full bg-transparent font-semibold text-xl outline-none placeholder:text-muted-foreground/40"
          />
          {statusLabel && (
            <p className="mt-1 text-muted-foreground/70 text-xs">
              {statusLabel}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {backlink}

      <RichTextEditor
        variant="inline"
        className="min-h-0 flex-1"
        value={note.contents}
        onChange={handleContentsChange}
        placeholder={t("contentsPlaceholder")}
        ariaLabel={t("noteLabel")}
      />
    </div>
  );
}
