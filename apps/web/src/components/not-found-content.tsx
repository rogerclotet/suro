import { ArrowLeft, Pin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default function NotFoundContent({
  locale,
  title,
  description,
  homeLabel,
}: {
  locale: Locale;
  title: string;
  description: string;
  homeLabel: string;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-16 text-center [[data-slot=sidebar-inset]_&]:min-h-full">
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="mb-12 flex items-center gap-2">
          <Image src="/logo.png" alt="" width={36} height={36} priority />
          <span className="font-display font-semibold text-lg">Suro</span>
        </div>

        <div className="relative mb-10 -rotate-3 rounded-xl border border-border bg-popover px-12 py-8 shadow-lg sm:px-16">
          <Pin
            aria-hidden="true"
            className="absolute -top-3 left-1/2 size-6 -translate-x-1/2 rotate-12 text-secondary"
          />
          <p className="font-display text-8xl text-primary tracking-tight sm:text-9xl">
            404
          </p>
        </div>

        <h1 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-sm text-pretty text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
        <Button asChild size="lg" className="mt-8">
          <a href={getPathname({ href: "/", locale })}>
            <ArrowLeft aria-hidden="true" />
            {homeLabel}
          </a>
        </Button>
      </div>
    </main>
  );
}
