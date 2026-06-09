"use client";

import { CalendarFold } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ClientOnly } from "@/components/client-only";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ShareButton from "@/components/ui/share-button";
import { getPathname, Link } from "@/i18n/navigation";
import {
  useProjectLists,
  useProjectTemplates,
} from "@/lib/queries/use-project-lists";
import { textToHtml } from "@/lib/utils";
import TimeRange from "../../../calendar/_components/event/time-range";
import CheckList from "./check-list";
import ListsDropdown from "./lists-dropdown";
import SettingsMenu from "./settings/settings-menu";

export default function ListsClientContainer({
  initialListId,
  projectId,
}: {
  initialListId: string;
  projectId: string;
}) {
  const [currentListId, setCurrentListId] = useState(initialListId);
  const locale = useLocale();
  const tLists = useTranslations("lists");
  const tErrors = useTranslations("errors");

  // Lists + templates come reactively from Convex.
  const lists = useProjectLists(projectId);
  const templates = useProjectTemplates(projectId) ?? [];

  function handleListChange(newListId: string) {
    setCurrentListId(newListId);
    const newPath = getPathname({
      href: {
        pathname: "/groups/[projectId]/lists/[listId]",
        params: { projectId, listId: newListId },
      },
      locale,
    });
    window.history.pushState({ listId: newListId }, "", newPath);
  }

  // Sync currentListId with browser back/forward
  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const available = lists ?? [];
      const listId: string | undefined = event.state?.listId;
      if (listId && available.some((l) => l.id === listId)) {
        setCurrentListId(listId);
      } else {
        const segments = window.location.pathname.split("/").filter(Boolean);
        const urlListId = segments.at(-1);
        if (urlListId && available.some((l) => l.id === urlListId)) {
          setCurrentListId(urlListId);
        }
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [lists]);

  if (lists === undefined) {
    return null;
  }

  const currentList = lists.find((l) => l.id === currentListId) ?? null;

  if (!currentList) {
    return (
      <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertDescription>
            <p>{tLists("notFound")}</p>
            <div className="mt-4">
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  {tErrors("backHome")}
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1>
          <ListsDropdown
            listId={currentListId}
            lists={lists}
            onListChange={handleListChange}
          />
        </h1>

        <div className="flex items-center gap-2">
          <ClientOnly>
            <ShareButton
              title={currentList.name}
              text={currentList.description ?? ""}
              href={{
                pathname: "/groups/[projectId]/lists/[listId]",
                params: {
                  projectId: currentList.projectId,
                  listId: currentList.id,
                },
              }}
            />
          </ClientOnly>
          <SettingsMenu list={currentList} templates={templates} />
        </div>
      </div>

      {currentList.event && (
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex items-center gap-2">
            <CalendarFold />
            <Link
              href={{
                pathname: "/groups/[projectId]/calendar/[eventId]",
                params: {
                  projectId: currentList.projectId,
                  eventId: currentList.event.id,
                },
              }}
            >
              {currentList.event.name}
            </Link>
          </h2>
          <TimeRange
            startAt={currentList.event.startAt}
            endAt={currentList.event.endAt}
            allDay={currentList.event.allDay}
            className="mt-0.5 text-muted-foreground text-sm"
          />
        </div>
      )}

      {currentList.description && (
        <p
          // biome-ignore lint/security/noDangerouslySetInnerHtml: This is safe because the description is sanitized
          dangerouslySetInnerHTML={{
            __html: textToHtml(currentList.description),
          }}
        />
      )}

      <CheckList list={currentList} />
    </div>
  );
}
