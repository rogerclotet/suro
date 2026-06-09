"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { api } from "backend/convex/_generated/api";
import { useMutation } from "convex/react";
import { Info, SaveIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as v from "valibot";
import ColorPicker from "@/components/color-picker";
import ImageUpload, {
  type ImageAction,
  Trash2,
  Undo2,
} from "@/components/image-upload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SubmitButton from "@/components/ui/submit-button";
import UserAvatar from "@/components/user-avatar";
import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { CatppuccinColor } from "@/lib/catppuccin-colors";
import { DATE_LOCALE_OPTIONS, normalizeDateLocale } from "@/lib/date-locale";
import { useSession } from "@/lib/session";
import ThemeSettings from "../theme-settings";
import { editProfile } from "./actions";
import { profileSchema } from "./data";

interface ProfileUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  customImage: string | null;
  avatarColor: string | null;
  dateLocale: string | null;
  locale: string | null;
}

const LANGUAGE_LABELS: Record<(typeof routing.locales)[number], string> = {
  ca: "Català",
  es: "Español",
  en: "English",
};

function normalizeLocale(value: string | null | undefined) {
  if (value && (routing.locales as readonly string[]).includes(value)) {
    return value as (typeof routing.locales)[number];
  }
  return routing.defaultLocale;
}

export default function ProfileEditor({ user }: { user: ProfileUser }) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const router = useRouter();
  // Default the language field to the current interface locale so what the
  // user sees in the dropdown matches what they're currently browsing in,
  // even if their stored DB preference is stale (e.g. they followed a link
  // to a different locale, or they're a new user with the default locale).
  const currentLocale = normalizeLocale(useLocale());
  const form = useForm<v.InferInput<typeof profileSchema>>({
    defaultValues: {
      name: user.name ?? "",
      avatarColor: user.avatarColor,
      dateLocale: normalizeDateLocale(user.dateLocale),
      locale: currentLocale,
    },
    resolver: valibotResolver(profileSchema),
  });
  const { data: session } = useSession();
  const removeAvatarImage = useMutation(api.users.removeAvatarImage);
  const resetProviderImage = useMutation(api.users.resetProviderImage);
  const [imageCleared, setImageCleared] = useState(false);

  const watchedColor = form.watch("avatarColor");

  const avatarUser = imageCleared
    ? { ...user, image: null, customImage: null, avatarColor: watchedColor }
    : { ...user, avatarColor: watchedColor };

  const imageActions: ImageAction[] = [];
  if (!imageCleared) {
    if (user.customImage && user.image) {
      imageActions.push({
        label: t("resetGoogleImage"),
        icon: Undo2,
        onAction: async () => {
          await resetProviderImage({});
        },
      });
    }
    if (user.customImage || user.image) {
      imageActions.push({
        label: t("removeImage"),
        icon: Trash2,
        onAction: async () => {
          await removeAvatarImage({});
        },
      });
    }
  }

  async function onSubmit(data: v.InferInput<typeof profileSchema>) {
    try {
      await editProfile(data);
      form.reset({
        name: data.name,
        avatarColor: data.avatarColor,
        dateLocale: data.dateLocale,
        locale: data.locale,
      });
      toast.success(t("saved"));
      if (data.locale !== currentLocale) {
        router.replace("/profile", { locale: data.locale });
      }
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "edit_profile",
        userId: user.id,
        data,
      });
      toast.error(t("saveError"));
    }
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p>{t("publicInfo")}</p>
          <p>{t("customizeHint")}</p>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <Label>{tCommon("name")}</Label>
                <FormControl>
                  <Input {...field} placeholder={t("namePlaceholder")} />
                </FormControl>
                <Label className="text-muted-foreground text-sm italic">
                  {t("namePublicHint")}
                </Label>
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>{tCommon("email")}</Label>
            <Input value={user.email ?? ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>{t("avatar")}</Label>
            <ImageUpload
              target={{ kind: "avatar" }}
              actions={imageActions}
              uploadedActions={[
                ...(user.image
                  ? [
                      {
                        label: t("resetGoogleImage"),
                        icon: Undo2,
                        onAction: async () => {
                          await resetProviderImage({});
                        },
                      } satisfies ImageAction,
                    ]
                  : []),
                {
                  label: t("removeImage"),
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

          <FormField
            control={form.control}
            name="avatarColor"
            render={({ field }) => (
              <FormItem>
                <Label>{t("backgroundColor")}</Label>
                <FormControl>
                  <ColorPicker
                    value={field.value as CatppuccinColor | null | undefined}
                    onChange={(color) => field.onChange(color)}
                  />
                </FormControl>
                <Label className="text-muted-foreground text-sm italic">
                  {t("backgroundColorHint")}
                </Label>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locale"
            render={({ field }) => (
              <FormItem>
                <Label>{t("language")}</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("languagePlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {routing.locales.map((locale) => (
                      <SelectItem key={locale} value={locale}>
                        {LANGUAGE_LABELS[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{t("languageDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateLocale"
            render={({ field }) => (
              <FormItem>
                <Label>{t("dateFormat")}</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("dateFormatPlaceholder")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DATE_LOCALE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{t("dateFormatDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <SubmitButton
            icon={<SaveIcon />}
            text={tCommon("save")}
            formState={form.formState}
          />
        </form>
      </Form>

      <div className="border-t pt-4">
        <ThemeSettings />
      </div>
    </div>
  );
}
