"use client";

import type { Template } from "@/app/_data/list";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UnreadDot } from "@/components/unread-badge";
import { Link } from "@/i18n/navigation";
import { useUnreadItemCount } from "@/lib/queries/use-notifications";

export default function TemplatePreview({ template }: { template: Template }) {
  const changes = useUnreadItemCount(template.projectId, template.id);
  return (
    <Link
      href={
        {
          pathname: "/groups/[projectId]/lists/templates/[templateId]",
          params: { projectId: template.projectId, templateId: template.id },
        } as never
      }
      className="block break-inside-avoid-column"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="min-w-0 truncate">{template.name}</span>
            <UnreadDot count={changes} />
          </CardTitle>
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
