import { CalendarFold, Check } from "lucide-react";
import Link from "next/link";
import type { List } from "@/app/_data/list";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ListPreview({ list }: { list: List }) {
  const todoCount = list.items.filter((item) => !item.completed).length;
  const completed = list.items.length > 0 && todoCount === 0;

  return (
    <Link href={`/grups/${list.projectId}/llistes/${list.id}`}>
      <Card className={cn("h-full", completed ? "opacity-50" : "")}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{list.name}</CardTitle>
            {completed ? (
              <Check />
            ) : todoCount === 0 ? null : (
              <Badge variant="secondary">{todoCount}</Badge>
            )}
          </div>
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
        </CardHeader>
      </Card>
    </Link>
  );
}

export function ListPreviewSkeleton() {
  return <Skeleton className="h-20 w-full bg-card" />;
}
