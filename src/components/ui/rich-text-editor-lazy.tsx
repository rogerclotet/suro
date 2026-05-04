"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const RichTextEditor = dynamic(
  () => import("./rich-text-editor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="rich-text-editor rounded-md border border-input bg-background">
        <div className="h-10 border-input border-b" />
        <Skeleton className="m-3 h-24 rounded-sm" />
      </div>
    ),
  },
);
