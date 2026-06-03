"use client";

import { CalendarFold } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import type { File } from "@/app/_data/file";
import { Link } from "@/i18n/navigation";
import { readableSize } from "../../readable-size";
import DeleteFileButton from "../delete-file/delete-file-button";
import EditFileButton from "../edit-file/edit-file-button";

export default function FileCard({ file }: { file: File }) {
  const session = useSession();
  const isOwner = file.uploadedBy.id === session?.data?.user.id;

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <NextLink
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-square w-full overflow-hidden rounded-lg bg-card"
      >
        <FilePreviewContent file={file} />
      </NextLink>

      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex min-w-0 flex-row items-center justify-between gap-2">
          <NextLink
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate font-medium text-md"
          >
            {file.name}
          </NextLink>
          {isOwner && (
            <span className="flex shrink-0 items-center gap-2">
              <EditFileButton file={file} />
              <DeleteFileButton file={file} />
            </span>
          )}
        </div>

        <span className="text-muted-foreground text-sm">
          {readableSize(file.size)}
        </span>

        <ExtraInfo file={file} />
      </div>
    </div>
  );
}

function ExtraInfo({ file }: { file: File }) {
  if (file.event) {
    return (
      <Link
        href={
          {
            pathname: "/groups/[projectId]/calendar/[eventId]",
            params: { projectId: file.event.projectId, eventId: file.event.id },
          } as never
        }
        className="flex min-w-0 flex-row items-center gap-2 text-muted-foreground text-sm"
      >
        <CalendarFold size={14} className="shrink-0" />
        <span className="truncate">{file.event.name}</span>
      </Link>
    );
  }

  return (
    <span className="truncate text-muted-foreground text-sm">
      {file.uploadedBy.name}
    </span>
  );
}

function FilePreviewContent({ file }: { file: File }) {
  if (file.type.includes("image")) {
    return (
      <Image
        src={file.url}
        alt={file.name}
        width={350}
        height={350}
        className="h-full w-full object-cover"
      />
    );
  }

  if (file.thumbnailUrl) {
    return (
      <div className="relative h-full w-full">
        <Image
          src={file.thumbnailUrl}
          alt={file.name}
          width={350}
          height={350}
          className="h-full w-full object-cover object-top"
        />
        <Image
          src="/pdf.svg"
          alt=""
          aria-hidden
          width={32}
          height={32}
          className="absolute right-2 bottom-2 drop-shadow-md"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <Image
        src="/pdf.svg"
        alt={file.name}
        width={350}
        height={350}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
