import type { Template } from "@/app/_data/list";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function TemplatePreview({ template }: { template: Template }) {
  return (
    <Link
      href={`/projectes/${template.projectId}/llistes/plantilles/${template.id}`}
    >
      <Card>
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
          {template.description && (
            <CardDescription className="line-clamp-2">
              {template.description}
            </CardDescription>
          )}
        </CardHeader>
      </Card>
    </Link>
  );
}

export function TemplatePreviewSkeleton() {
  return <Skeleton className="h-36 w-full" />;
}
