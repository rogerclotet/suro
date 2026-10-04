import { ArrowLeft } from "lucide-react";
import PageFeedback from "@/components/page-feedback";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default function NotFoundContent({
  locale,
  title,
  description,
  homeLabel,
}: {
  locale: Locale;
  title: string;
  description: string;
  homeLabel: string;
}) {
  return (
    <PageFeedback kind="not-found" title={title} description={description}>
      <Button asChild size="lg">
        <a href={getPathname({ href: "/", locale })}>
          <ArrowLeft aria-hidden="true" />
          {homeLabel}
        </a>
      </Button>
    </PageFeedback>
  );
}
