import type { List } from "@/app/_data/list";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";
import Link from "next/link";

export default function ListPreview({ list }: { list: List }) {
  const todoCount = list.items.filter((item) => !item.completed).length;

  return (
    <Link href={`/projectes/${list.projectId}/llistes/${list.id}`}>
      <Card className={todoCount === 0 ? "opacity-50" : ""}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{list.name}</CardTitle>
            {todoCount > 0 ? (
              <Badge variant="secondary">{todoCount}</Badge>
            ) : (
              <Check />
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {list.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export function ListPreviewSkeleton() {
  return <Skeleton className="h-36 w-full" />;
}
