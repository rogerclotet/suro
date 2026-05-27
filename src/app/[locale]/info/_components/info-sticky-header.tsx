"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import InfoLanguageSwitcher from "./info-language-switcher";

export default function InfoStickyHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 px-6 transition-colors duration-150",
        scrolled
          ? "border-border border-b bg-background/70 backdrop-blur-md"
          : "border-transparent border-b bg-transparent",
      )}
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Suro" width={32} height={32} priority />
          <span className="font-semibold text-foreground">Suro</span>
        </Link>
        <InfoLanguageSwitcher />
      </div>
    </header>
  );
}
