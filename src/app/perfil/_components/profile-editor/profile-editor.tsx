"use client";

import { valibotResolver } from "@hookform/resolvers/valibot";
import { Info, SaveIcon } from "lucide-react";
import { useSession } from "next-auth/react";
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
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/ui/submit-button";
import UserAvatar from "@/components/user-avatar";
import type { CatppuccinColor } from "@/lib/catppuccin-colors";
import { editProfile, removeProfileImage, resetProfileImage } from "./actions";
import { profileSchema } from "./data";

interface ProfileUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  customImage: string | null;
  avatarColor: string | null;
}

export default function ProfileEditor({ user }: { user: ProfileUser }) {
  const form = useForm<v.InferInput<typeof profileSchema>>({
    defaultValues: {
      name: user.name ?? "",
      avatarColor: user.avatarColor,
    },
    resolver: valibotResolver(profileSchema),
  });
  const { data: session } = useSession();
  const [imageCleared, setImageCleared] = useState(false);

  const watchedColor = form.watch("avatarColor");

  // When the user removes their image, clear it locally so the avatar updates immediately
  const avatarUser = imageCleared
    ? { ...user, image: null, customImage: null, avatarColor: watchedColor }
    : { ...user, avatarColor: watchedColor };

  const imageActions: ImageAction[] = [];
  if (!imageCleared) {
    if (user.customImage && user.image) {
      imageActions.push({
        label: "Restablir imatge de Google",
        icon: Undo2,
        onAction: resetProfileImage,
      });
    }
    if (user.customImage || user.image) {
      imageActions.push({
        label: "Eliminar imatge",
        icon: Trash2,
        onAction: removeProfileImage,
      });
    }
  }

  async function onSubmit(data: v.InferInput<typeof profileSchema>) {
    try {
      await editProfile(data);
      form.reset({ name: data.name, avatarColor: data.avatarColor });
      toast.success("S'ha desat el perfil");
    } catch (e) {
      posthog.captureException(e, {
        distinctId: session?.user.id,
        action: "edit_profile",
        userId: user.id,
        data,
      });
      toast.error("No s'ha pogut desar el perfil, torna-ho a provar més tard");
    }
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p>
            {
              "Aquesta és la informació que es mostra a tots els teus grups i que es pot veure públicament."
            }
          </p>
          <p>
            {
              "Pots pujar una imatge de perfil personalitzada o triar un color de fons per a la teva inicial."
            }
          </p>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <Label>Nom</Label>
                <FormControl>
                  <Input {...field} placeholder="Nom" />
                </FormControl>
                <Label className="text-muted-foreground text-sm italic">
                  Aquest nom serà visible públicament a tots els teus grups
                </Label>
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email ?? ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>Avatar</Label>
            <ImageUpload
              endpoint="profileImageUploader"
              actions={imageActions}
              uploadedActions={[
                ...(user.image
                  ? [
                      {
                        label: "Restablir imatge de Google",
                        icon: Undo2,
                        onAction: resetProfileImage,
                      } satisfies ImageAction,
                    ]
                  : []),
                {
                  label: "Eliminar imatge",
                  icon: Trash2,
                  onAction: removeProfileImage,
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
                <Label>Color de fons</Label>
                <FormControl>
                  <ColorPicker
                    value={field.value as CatppuccinColor | null | undefined}
                    onChange={(color) => field.onChange(color)}
                  />
                </FormControl>
                <Label className="text-muted-foreground text-sm italic">
                  El color de fons es mostra quan no hi ha imatge de perfil
                </Label>
              </FormItem>
            )}
          />

          <SubmitButton
            icon={<SaveIcon />}
            text="Desar"
            formState={form.formState}
          />
        </form>
      </Form>
    </div>
  );
}
