"use client";

"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { toast } from "sonner";
import type { Event } from "@/app/_data/event";
import type { Project } from "@/app/_data/project";
import { UploadButton as UploadthingButton } from "@/components/uploadthing";

export default function UploadButton({
  projectId,
  eventId,
}: {
  projectId: Project["id"];
  eventId?: Event["id"] | undefined;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("files");
  const tCommon = useTranslations("common");

  return (
    <div>
      <UploadthingButton
        endpoint="fileUploader"
        headers={{
          "x-project-id": projectId,
          "x-event-id": eventId ?? "",
        }}
        onClientUploadComplete={(_res) => {
          toast.success(t("shareSuccess"));
          router.refresh();
        }}
        onUploadError={(error: Error) => {
          posthog.captureException(error, {
            distinctId: session?.user.id,
            action: "upload_file",
            projectId,
            eventId,
          });
          toast.error(t("shareError"));
        }}
        content={{
          button({ ready }) {
            if (ready) {
              return (
                <div className="flex items-center gap-2 text-nowrap font-medium text-sm">
                  <Upload /> {t("shareTitle")}
                </div>
              );
            }
            return (
              <div>
                <Loader2 className="animate-spin" /> {tCommon("loading")}
              </div>
            );
          },
          allowedContent({ ready, isUploading }) {
            if (!ready) return tCommon("loadingEllipsis");
            if (isUploading) return t("uploading");
            return t("allowedContent");
          },
        }}
        className="ut-button:h-9 ut-button:w-full ut-button:bg-primary ut-button:px-3 ut-allowed-content:text-muted-foreground ut-button:text-primary-foreground ring-offset-background ut-button:ring-offset-background transition-colors after:ut-button:bg-accent after:ut-button:opacity-70 ut-button:focus-visible:outline-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ut-button:focus-visible:ring-2 ut-button:focus-visible:ring-ring focus-visible:ring-offset-2 ut-button:focus-visible:ring-offset-2"
      />
    </div>
  );
}
