"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function PrivacyDialog({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("privacy");

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-border border-b bg-background px-6 pt-6 pb-4">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
