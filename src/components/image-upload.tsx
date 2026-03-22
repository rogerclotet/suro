"use client";

import { Camera, Loader2, type LucideIcon, Trash2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import { UploadButton } from "@/components/uploadthing";
import { Button } from "./ui/button";

export interface ImageAction {
  label: string;
  icon?: LucideIcon;
  variant?: "ghost" | "destructive";
  onAction: () => Promise<void>;
}

interface ImageUploadProps {
  endpoint: "profileImageUploader" | "groupImageUploader";
  headers?: Record<string, string>;
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
  endpoint,
  headers,
  actions,
  uploadedActions,
  onUploadComplete,
  onActionComplete,
  children,
}: ImageUploadProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [uploaded, setUploaded] = useState(false);

  const visibleActions =
    uploaded && uploadedActions?.length ? uploadedActions : actions;

  return (
    <div className="flex items-center gap-4">
      {children}
      <div className="flex flex-col">
        <UploadButton
          endpoint={endpoint}
          headers={headers}
          onClientUploadComplete={() => {
            setUploaded(true);
            toast.success("Imatge actualitzada");
            onUploadComplete?.();
            router.refresh();
          }}
          onUploadError={(error: Error) => {
            posthog.captureException(error, {
              distinctId: session?.user.id,
              action: `upload_${endpoint}`,
            });
            toast.error("No s'ha pogut pujar la imatge");
          }}
          content={{
            button({ ready, isUploading }) {
              if (isUploading) {
                return (
                  <div className="flex items-center gap-2 text-nowrap text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" /> Pujant...
                  </div>
                );
              }
              if (ready) {
                return (
                  <div className="flex items-center gap-2 text-nowrap text-sm">
                    <Camera className="h-4 w-4" /> Canviar imatge
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-2 text-nowrap text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregant...
                </div>
              );
            },
            allowedContent() {
              return "";
            },
          }}
          className="[&_label]:!h-8 [&_label]:!w-full [&_label]:!rounded-md [&_label]:!bg-secondary [&_label]:!text-secondary-foreground !gap-0 ut-allowed-content:hidden ut-button:bg-secondary ut-button:px-3 ut-button:font-medium ut-button:text-secondary-foreground ring-offset-background ut-button:ring-offset-background transition-colors after:ut-button:bg-accent after:ut-button:opacity-70 ut-button:focus-visible:outline-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ut-button:focus-visible:ring-2 ut-button:focus-visible:ring-ring focus-visible:ring-offset-2 ut-button:focus-visible:ring-offset-2"
        />
        {visibleActions?.map((action) => {
          const Icon = action.icon ?? Trash2;
          return (
            <Button
              key={action.label}
              type="button"
              variant={action.variant ?? "ghost"}
              size="sm"
              className="h-8 w-full justify-start"
              onClick={async () => {
                try {
                  await action.onAction();
                  setUploaded(false);
                  toast.success("Imatge actualitzada");
                  onActionComplete?.();
                  router.refresh();
                } catch {
                  toast.error("No s'ha pogut actualitzar la imatge");
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
