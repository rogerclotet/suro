import { CalendarFold } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { File } from "@/app/_data/file";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/touch-tooltip";
import { readableSize } from "../../readable-size";
import DeleteFileButton from "../delete-file/delete-file-button";
import EditFileButton from "../edit-file/edit-file-button";

export default function FileListItem({ file }: { file: File }) {
  const session = useSession();

  return (
    <li className="flex h-16 items-center gap-4 border-background not-last:border-b-2 hover:bg-muted">
      <Link href={file.url} target="_blank" rel="noopener noreferrer">
        <div className="flex w-16 shrink-0 items-center justify-center overflow-hidden">
          {file.type.includes("image") ? (
            <Image src={file.url} alt={file.name} width={42} height={42} />
          ) : (
            <Image
              src="/pdf.svg"
              alt={file.name}
              width={42}
              height={42}
              className="aspect-square"
            />
          )}
        </div>
      </Link>

      <div className="flex min-w-0 grow flex-col justify-around gap-0.5">
        <div className="flex min-w-0 flex-row items-center gap-2">
          <Link
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate"
          >
            <span className="truncate">{file.name}</span>
          </Link>

          {file.uploadedBy.id === session?.data?.user.id && (
            <>
              <EditFileButton file={file} />
              <DeleteFileButton file={file} />
            </>
          )}
        </div>

        <span className="text-muted-foreground text-xs">
          {readableSize(file.size)}
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end pr-4">
        <Tooltip>
          <TooltipTrigger>
            <span className="line-clamp-2 max-w-32 text-muted-foreground text-sm">
              {file.uploadedBy.name}
            </span>
          </TooltipTrigger>
          <TooltipContent>{file.uploadedBy.name}</TooltipContent>
        </Tooltip>

        {file.event && (
          <Link
            href={`/grups/${file.event.projectId}/calendari/${file.event.id}`}
          >
            <span className="line-clamp-2 flex max-w-32 flex-row items-center gap-2 text-muted-foreground text-sm">
              <CalendarFold size={14} className="shrink-0" />
              <span className="line-clamp-1">{file.event.name}</span>
            </span>
          </Link>
        )}
      </div>
    </li>
  );
}
