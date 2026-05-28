"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RichTextEditor as RichTextEditorComponent } from "./rich-text-editor";

type RichTextEditorProps = ComponentProps<typeof RichTextEditorComponent>;

function BoxedSkeleton() {
  return (
    <div className="rich-text-editor rounded-md border border-input bg-background">
      <div className="h-10 border-input border-b" />
      <Skeleton className="m-3 h-24 rounded-sm" />
    </div>
  );
}

function InlineSkeleton() {
  return (
    <div className="rich-text-editor flex min-h-[200px] flex-1 flex-col bg-background">
      <div className="h-10 shrink-0 border-input border-b" />
      <Skeleton className="my-3 flex-1 rounded-sm" />
    </div>
  );
}

const BoxedEditor = dynamic(
  () => import("./rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <BoxedSkeleton /> },
);

const InlineEditor = dynamic(
  () => import("./rich-text-editor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => <InlineSkeleton /> },
);

export function RichTextEditor(props: RichTextEditorProps) {
  return props.variant === "inline" ? (
    <InlineEditor {...props} />
  ) : (
    <BoxedEditor {...props} />
  );
}
