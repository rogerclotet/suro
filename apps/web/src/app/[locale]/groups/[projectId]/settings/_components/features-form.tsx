"use client";

import { GiftIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/app/_data/project";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/lib/session";
import { updateProjectFeatures } from "@/server/projects/settings";

export default function FeaturesForm({ project }: { project: Project }) {
  const t = useTranslations("groupSettings");
  const { data: session } = useSession();
  const [secretSanta, setSecretSanta] = useState(project.features.secretSanta);
  const [pending, setPending] = useState(false);

  async function toggleSecretSanta(value: boolean) {
    const previous = secretSanta;
    setSecretSanta(value);
    setPending(true);
    try {
      await updateProjectFeatures(project.id, { secretSanta: value });
      toast.success(t("updateSuccess"));
    } catch (e) {
      setSecretSanta(previous);
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "update_project_features",
        projectId: project.id,
      });
      toast.error(t("updateError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <GiftIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <Label
              htmlFor="feature-secret-santa"
              className="font-medium text-base"
            >
              {t("featureSecretSantaLabel")}
            </Label>
            <p className="text-muted-foreground text-sm">
              {t("featureSecretSantaDescription")}
            </p>
          </div>
        </div>
        <Switch
          id="feature-secret-santa"
          checked={secretSanta}
          disabled={pending}
          onCheckedChange={toggleSecretSanta}
        />
      </div>
    </div>
  );
}
