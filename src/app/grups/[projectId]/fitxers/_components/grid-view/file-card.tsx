import { CalendarFold } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { File } from "@/app/_data/file";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { readableSize } from "../../readable-size";
import DeleteFileButton from "../delete-file/delete-file-button";
import EditFileButton from "../edit-file/edit-file-button";

export default function FileCard({ file }: { file: File }) {
  const session = useSession();

  return (
    <Card className="max-w-[180px] overflow-hidden">
      <CardHeader>
        <CardTitle className="flex flex-row items-center justify-between gap-2 text-md">
          <Link
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate"
          >
            {file.name}
          </Link>
        </CardTitle>
        <CardDescription>
          <span className="flex flex-col">
            <span className="flex flex-row items-center justify-between gap-2">
              {readableSize(file.size)}
              {file.uploadedBy.id === session?.data?.user.id && (
                <span className="mb-0.5 flex flex-row items-center gap-2">
                  <EditFileButton file={file} />
                  <DeleteFileButton file={file} />
                </span>
              )}
            </span>
            <ExtraInfo file={file} />
          </span>
        </CardDescription>
      </CardHeader>
      <CardFooter className="aspect-square">
        <Link href={file.url} target="_blank" rel="noopener noreferrer">
          <FilePreviewContent file={file} />
        </Link>
      </CardFooter>
    </Card>
  );
}

function ExtraInfo({ file }: { file: File }) {
  if (file.event) {
    return (
      <Link
        href={`/grups/${file.event.projectId}/calendari/${file.event.id}`}
        className="line-clamp-1 flex flex-row items-center gap-2"
      >
        <CalendarFold size={14} className="shrink-0" />
        <span className="line-clamp-1">{file.event.name}</span>
      </Link>
    );
  }

  return <span className="line-clamp-1">{file.uploadedBy.name}</span>;
}

function FilePreviewContent({ file }: { file: File }) {
  if (file.type.includes("image")) {
    return (
      <Image
        src={file.url}
        alt={file.name}
        width={350}
        height={350}
        className="aspect-square object-cover"
      />
    );
  }

  return (
    <Image
      src="/pdf.svg"
      alt={file.name}
      width={350}
      height={350}
      className="aspect-square"
    />
  );
}
