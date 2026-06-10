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

// The trigger button is created here, inside this client component, rather than
// accepted as a pre-built element. A React element created in a Server Component
// and passed through Radix's `asChild` (Slot.cloneElement) fails to server-render
// under React 19, which dropped this dialog from the SSR output and caused a
// hydration mismatch on the landing page.
export default function PrivacyDialog({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const t = useTranslations("privacy");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
        >
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 border-border border-b bg-background px-6 pt-6 pb-4">
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
