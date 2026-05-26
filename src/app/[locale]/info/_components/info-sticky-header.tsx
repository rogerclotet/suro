"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import InfoLanguageSwitcher from "./info-language-switcher";

export default function InfoStickyHeader({ title }: { title: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById("info-hero-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setScrolled(!entry.isIntersecting);
      },
      { rootMargin: "-1px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 px-6 transition-all duration-200",
        scrolled
          ? "border-border border-b bg-background/70 py-3 backdrop-blur-md"
          : "border-transparent border-b bg-transparent py-5",
      )}
      style={{
        paddingTop: scrolled
          ? undefined
          : "max(1.25rem, env(safe-area-inset-top))",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Suro" width={32} height={32} priority />
          <span className="font-semibold text-foreground">Suro</span>
        </Link>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-center font-medium text-foreground text-sm transition-opacity duration-200 sm:text-base",
            scrolled ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={!scrolled}
        >
          {title}
        </span>
        <div className="shrink-0">
          <InfoLanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
