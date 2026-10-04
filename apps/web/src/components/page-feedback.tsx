import { Pin, Unplug, WifiOff } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

export default function PageFeedback({
  kind,
  title,
  description,
  children,
}: {
  kind: "not-found" | "error" | "offline";
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12 text-center text-foreground sm:py-16 [[data-slot=sidebar-inset]_&]:min-h-full">
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="mb-10 flex items-center gap-2">
          <Image src="/logo.png" alt="" width={36} height={36} priority />
          <span className="font-display font-semibold text-lg">Suro</span>
        </div>

        <div
          aria-hidden="true"
          className="relative mb-10 -rotate-3 rounded-xl border border-border bg-popover px-12 py-8 shadow-lg sm:px-16"
        >
          <Pin className="absolute -top-3 left-1/2 size-6 -translate-x-1/2 rotate-12 text-secondary" />
          {kind === "not-found" ? (
            <p className="font-display text-8xl text-primary tracking-tight sm:text-9xl">
              404
            </p>
          ) : kind === "offline" ? (
            <WifiOff
              className="size-20 text-primary sm:size-24"
              strokeWidth={1.25}
            />
          ) : (
            <Unplug
              className="size-20 text-primary sm:size-24"
              strokeWidth={1.25}
            />
          )}
        </div>

        <h1 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-sm text-pretty text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
          {children}
        </div>
      </div>
    </main>
  );
}
