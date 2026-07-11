"use client";

import { api } from "backend/convex/_generated/api";
import type { Id } from "backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export default function UploadButton({
  projectId,
  eventId,
  variant = "default",
  className,
  onUploadingChange,
}: {
  projectId: string;
  eventId?: string | undefined;
  variant?: "default" | "chip";
  className?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const { data: session } = useSession();
  const t = useTranslations("files");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const uploadUrl = await generateUploadUrl({
          projectId: projectId as Id<"projects">,
        });
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) {
          throw new Error(`Upload failed: ${res.status}`);
        }
        const { storageId } = (await res.json()) as {
          storageId: Id<"_storage">;
        };
        await saveFile({
          projectId: projectId as Id<"projects">,
          storageId,
          name: file.name,
          type: file.type,
          size: file.size,
          eventId: eventId ? (eventId as Id<"events">) : undefined,
        });
      }
      toast.success(t("shareSuccess"));
    } catch (error) {
      posthog.captureException(error, {
        distinctId: session?.user.id,
        action: "upload_file",
        projectId,
        eventId,
      });
      toast.error(t("shareError"));
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant={variant === "chip" ? "outline" : "default"}
        size={variant === "chip" ? "sm" : "default"}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          variant === "chip"
            ? "h-7 gap-1.5 rounded-full border-dashed px-3 font-normal text-muted-foreground text-xs shadow-none hover:text-foreground"
            : "w-full gap-2",
          className,
        )}
      >
        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
        {variant === "chip" ? t("uploadFile") : t("shareTitle")}
      </Button>
    </div>
  );
}
