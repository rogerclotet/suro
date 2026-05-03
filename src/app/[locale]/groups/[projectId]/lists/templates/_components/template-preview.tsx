import type { Template } from "@/app/_data/list";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";

export default function TemplatePreview({ template }: { template: Template }) {
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
