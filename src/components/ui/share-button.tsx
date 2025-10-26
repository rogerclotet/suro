"use client";

import { Share2 } from "lucide-react";
import { RWebShare } from "react-web-share";
import { Button } from "@/components/ui/button";

export default function ShareButton({
  title,
  text,
  path,
}: {
  title: string;
  text: string;
  path: string;
}) {
  return (
    <Button variant="ghost" size="icon" aria-label="Compartir">
      <RWebShare
        data={{
          title: title,
          text: text,
          url: `${window.location.origin}${path}`,
        }}
        closeText="Tancar"
      >
        <Share2 />
      </RWebShare>
    </Button>
  );
}
