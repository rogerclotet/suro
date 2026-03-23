import { CalendarFold, CheckIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import type { List } from "@/app/_data/list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "../[listId]/_components/settings/actions";

export default function ListPreview({ list }: { list: List }) {
  const todoCount = list.items.filter((item) => !item.completed).length;
  const completed = list.items.length > 0 && todoCount === 0;

  return (
    <div className="relative block break-inside-avoid-column">
      <Link href={`/grups/${list.projectId}/llistes/${list.id}`}>
        <Card className={cn("h-full", completed ? "opacity-50" : "")}>
          <CardHeader>
            <CardTitle>{list.name}</CardTitle>

            <CardAction className="flex items-center gap-1">
              {completed ? (
                <CheckIcon />
              ) : (
                todoCount > 0 && <Badge variant="secondary">{todoCount}</Badge>
              )}
            </CardAction>

            {list.event || list.description ? (
              <CardDescription className="flex flex-col gap-2">
                {list.event && (
                  <span className="flex items-center gap-2">
                    <CalendarFold size={16} />
                    {list.event.startAt.toLocaleString("ca-ES", {
                      dateStyle: "medium",
                    })}
                  </span>
                )}

                {list.description && (
                  <span className="line-clamp-2">{list.description}</span>
                )}
              </CardDescription>
            ) : null}
          </CardHeader>
        </Card>
      </Link>
      <form
        action={toggleFavorite.bind(null, list)}
        className="absolute bottom-2 right-2"
      >
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={list.favorite ? "Treu de favorits" : "Afegeix a favorits"}
        >
          <StarIcon
            size={14}
            className={
              list.favorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }
          />
        </Button>
      </form>
    </div>
  );
}

export function ListPreviewSkeleton() {
  return <Skeleton className="h-20 w-full bg-card" />;
}
