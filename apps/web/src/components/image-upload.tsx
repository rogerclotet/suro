"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Camera, Loader2, type LucideIcon, Trash2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { Button } from "./ui/button";

export interface ImageAction {
  label: string;
  icon?: LucideIcon;
  variant?: "ghost" | "destructive";
  onAction: () => Promise<void>;
}

/** Where a freshly uploaded image is stored: the current user's avatar, or a
 * group's image (creator-only, gated server-side). */
export type ImageUploadTarget =
  | { kind: "avatar" }
  | { kind: "group"; projectId: string };

interface ImageUploadProps {
  target: ImageUploadTarget;
  actions?: ImageAction[];
  /** Actions to show after a new image is uploaded (in addition to static actions) */
  uploadedActions?: ImageAction[];
  /** Called after a new image is uploaded */
  onUploadComplete?: () => void;
  /** Called after an action (remove/reset) completes successfully */
  onActionComplete?: () => void;
  children: React.ReactNode;
}

export default function ImageUpload({
  target,
  actions,
  uploadedActions,
  onUploadComplete,
  onActionComplete,
  children,
}: ImageUploadProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("common");

  const generateAvatarUploadUrl = useMutation(
    api.users.generateAvatarUploadUrl,
  );
  const setAvatarImage = useMutation(api.users.setAvatarImage);
  const generateGroupUploadUrl = useMutation(
    api.projects.generateImageUploadUrl,
  );
  const setGroupImage = useMutation(api.projects.setImage);

  const visibleActions =
    uploaded && uploadedActions?.length ? uploadedActions : actions;

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const uploadUrl =
        target.kind === "avatar"
          ? await generateAvatarUploadUrl({})
          : await generateGroupUploadUrl({
              projectId: target.projectId as Id<"projects">,
            });
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      if (target.kind === "avatar") {
        await setAvatarImage({ storageId });
      } else {
        await setGroupImage({
          projectId: target.projectId as Id<"projects">,
          storageId,
        });
      }
      setUploaded(true);
      toast.success(t("imageUpdated"));
      onUploadComplete?.();
      router.refresh();
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: `upload_image_${target.kind}`,
      });
      toast.error(t("imageUploadError"));
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      {children}
      <div className="flex flex-col gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 w-full justify-start gap-2"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {t("uploading")}
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" /> {t("changeImage")}
            </>
          )}
        </Button>
        {visibleActions?.map((action) => {
          const Icon = action.icon ?? Trash2;
          return (
            <Button
              key={action.label}
              type="button"
              variant={action.variant ?? "ghost"}
              size="sm"
              className="h-8 w-full justify-start gap-2"
              onClick={async () => {
                try {
                  await action.onAction();
                  setUploaded(false);
                  toast.success(t("imageUpdated"));
                  onActionComplete?.();
                  router.refresh();
                } catch {
                  toast.error(t("imageUpdateError"));
                }
              }}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export { Trash2, Undo2 };
