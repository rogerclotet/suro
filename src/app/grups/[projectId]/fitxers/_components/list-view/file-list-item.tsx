import type { File } from "@/app/_data/file";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { CalendarFold } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { readableSize } from "../../readable-size";
import DeleteFileButton from "../delete-file/delete-file-button";
import EditFileButton from "../edit-file/edit-file-button";

export default function FileListItem({ file }: { file: File }) {
  const session = useSession();

  return (
    <li className="flex h-16 items-center gap-4 border-background hover:bg-muted [&:not(:last-child)]:border-b-2">
      <Link href={file.url} target="_blank" rel="noopener noreferrer">
        <div className="flex w-16 flex-shrink-0 items-center justify-center overflow-hidden">
          {file.type === "image" ? (
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

      <div className="flex flex-grow flex-col justify-around gap-0.5">
        <div className="flex flex-row items-center gap-2">
          <Link href={file.url} target="_blank" rel="noopener noreferrer">
            <span className="line-clamp-1 [overflow-wrap:anywhere]">
              {file.name}
            </span>
          </Link>

          {file.uploadedBy.id === session?.data?.user.id && (
            <>
              <EditFileButton file={file} />
              <DeleteFileButton file={file} />
            </>
          )}
        </div>

        <span className="text-xs text-muted-foreground">
          {readableSize(file.size)}
        </span>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end pr-4">
        <Tooltip>
          <TooltipTrigger>
            <span className="line-clamp-2 max-w-32 text-sm text-muted-foreground">
              {file.uploadedBy.name}
            </span>
          </TooltipTrigger>
          <TooltipContent>{file.uploadedBy.name}</TooltipContent>
        </Tooltip>

        {file.event && (
          <Link
            href={`/grups/${file.event.projectId}/calendari/${file.event.id}`}
          >
            <span className="line-clamp-2 flex max-w-32 flex-row items-center gap-2 text-sm text-muted-foreground">
              <CalendarFold size={14} className="flex-shrink-0" />
              <span className="line-clamp-1">{file.event.name}</span>
            </span>
          </Link>
        )}
      </div>
    </li>
  );
}
