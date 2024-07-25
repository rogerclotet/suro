"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { RWebShare } from "react-web-share";

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
