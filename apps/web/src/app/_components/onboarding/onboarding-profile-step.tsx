"use client";

import { api } from "backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import ColorPicker from "@/components/color-picker";
import ImageUpload, {
  type ImageAction,
  Trash2,
  Undo2,
} from "@/components/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import UserAvatar from "@/components/user-avatar";
import type { CatppuccinColor } from "@/lib/catppuccin-colors";

interface ProfileUser {
  name?: string | null;
  image?: string | null;
  customImage?: string | null;
  avatarColor?: string | null;
}

interface OnboardingProfileStepProps {
  user: ProfileUser;
  name: string;
  onNameChange: (name: string) => void;
  avatarColor: CatppuccinColor | null;
  onAvatarColorChange: (color: CatppuccinColor) => void;
}

export default function OnboardingProfileStep({
  user,
  name,
  onNameChange,
  avatarColor,
  onAvatarColorChange,
}: OnboardingProfileStepProps) {
  const t = useTranslations("onboarding");
  const tProfile = useTranslations("profile");
  const tCommon = useTranslations("common");
  const removeAvatarImage = useMutation(api.users.removeAvatarImage);
  const resetProviderImage = useMutation(api.users.resetProviderImage);
  const [imageCleared, setImageCleared] = useState(false);

  const avatarUser = imageCleared
    ? { ...user, image: null, customImage: null, name, avatarColor }
    : { ...user, name, avatarColor };

  const imageActions: ImageAction[] = [];
  if (!imageCleared) {
    if (user.customImage && user.image) {
      imageActions.push({
        label: tProfile("resetGoogleImage"),
        icon: Undo2,
        onAction: async () => {
          await resetProviderImage({});
        },
      });
    }
    if (user.customImage || user.image) {
      imageActions.push({
        label: tProfile("removeImage"),
        icon: Trash2,
        onAction: async () => {
          await removeAvatarImage({});
        },
      });
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <UserIcon className="h-8 w-8" />
      </div>
      <div className="space-y-1 text-center">
        <h3 className="font-semibold text-xl">{t("profileTitle")}</h3>
        <p className="text-muted-foreground text-sm">{t("profileBody")}</p>
      </div>

      <div className="w-full space-y-4 pt-2">
        <div className="space-y-2">
          <Label>{tCommon("name")}</Label>
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={tProfile("namePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label>{tProfile("avatar")}</Label>
          <ImageUpload
            target={{ kind: "avatar" }}
            actions={imageActions}
            uploadedActions={[
              ...(user.image
                ? [
                    {
                      label: tProfile("resetGoogleImage"),
                      icon: Undo2,
                      onAction: async () => {
                        await resetProviderImage({});
                      },
                    } satisfies ImageAction,
                  ]
                : []),
              {
                label: tProfile("removeImage"),
                icon: Trash2,
                onAction: async () => {
                  await removeAvatarImage({});
                },
              },
            ]}
            onUploadComplete={() => setImageCleared(false)}
            onActionComplete={() => setImageCleared(true)}
          >
            <UserAvatar user={avatarUser} className="h-16 w-16 text-3xl" />
          </ImageUpload>
        </div>

        <div className="space-y-2">
          <Label>{tProfile("backgroundColor")}</Label>
          <ColorPicker value={avatarColor} onChange={onAvatarColorChange} />
        </div>
      </div>
    </div>
  );
}
