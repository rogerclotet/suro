"use client";

import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { RWebShare } from "react-web-share";

export default function ShareButton({
  name,
  text,
  path,
}: {
  name: string;
  text: string;
  path: string;
}) {
  const origin = window.location.origin;

  return (
    <Button variant="ghost" size="icon" aria-label="Compartir">
      <RWebShare
        data={{
          title: `Compartir ${name}`,
          text: text,
          url: `${origin}/${path}`,
        }}
        closeText="Tancar"
      >
        <Share2 />
      </RWebShare>
    </Button>
  );
}
