"use client";

import { Share2 } from "lucide-react";
import { useLocale } from "next-intl";
import { RWebShare } from "react-web-share";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";

type ShareHref = Parameters<typeof getPathname>[0]["href"];

export default function ShareButton({
  title,
  text,
  href,
}: {
  title: string;
  text: string;
  href: ShareHref;
}) {
  const locale = useLocale();
  const path = getPathname({ locale, href });
  const url = `${window.location.origin}${path}`;

  return (
    <Button variant="ghost" size="icon" aria-label="Compartir">
      <RWebShare data={{ title, text, url }} closeText="Tancar">
        <Share2 />
      </RWebShare>
    </Button>
  );
}
