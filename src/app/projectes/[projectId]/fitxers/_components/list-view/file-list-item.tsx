import type { File } from "@/app/_data/file";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import Image from "next/image";
import Link from "next/link";
import { readableSize } from "../../readable-size";

export default function FileListItem({ file }: { file: File }) {
  return (
    <li className="flex h-16 items-center justify-between gap-4 border-background hover:bg-muted [&:not(:last-child)]:border-b-2">
      <div className="flex h-full flex-row items-center gap-4">
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

        <div className="flex flex-col justify-around gap-0.5">
          <Link href={file.url} target="_blank" rel="noopener noreferrer">
            <span className="truncate">{file.name}</span>
          </Link>
          <span className="text-xs text-muted-foreground">
            {readableSize(file.size)}
          </span>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger>
          <span className="line-clamp-2 max-w-32 p-4 text-sm text-muted-foreground">
            {file.uploadedBy.name}
          </span>
        </TooltipTrigger>
        <TooltipContent>{file.uploadedBy.name}</TooltipContent>
      </Tooltip>
    </li>
  );
}
