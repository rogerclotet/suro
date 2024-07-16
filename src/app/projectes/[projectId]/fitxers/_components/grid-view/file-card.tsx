import type { File } from "@/app/_data/file";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { readableSize } from "../../readable-size";
import DeleteFileButton from "../delete-file/delete-file-button";
import EditFileButton from "../edit-file/edit-file-button";

export default function FileCard({ file }: { file: File }) {
  const session = useSession();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md flex flex-row items-center justify-between gap-2">
          <Link
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-1"
          >
            {file.name}
          </Link>
        </CardTitle>
        <CardDescription className="flex flex-row items-end justify-between gap-1">
          <span className="flex flex-col">
            <span>{readableSize(file.size)}</span>
            <span>{file.uploadedBy.name}</span>
          </span>

          {file.uploadedBy.id === session?.data?.user.id && (
            <span className="mb-0.5 flex flex-row items-center gap-2">
              <EditFileButton file={file} />
              <DeleteFileButton file={file} />
            </span>
          )}
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

function FilePreviewContent({ file }: { file: File }) {
  if (file.type === "image") {
    return <Image src={file.url} alt={file.name} width={350} height={350} />;
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
