import type { File } from "@/app/_data/file";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import Image from "next/image";
import Link from "next/link";

export default function FilePreview({ file }: { file: File }) {
  function printType() {
    if (file.type === "image") {
      return "imatge";
    }
    return file.type;
  }

  function printSize() {
    if (file.size < 1024) {
      return `${file.size} bytes`;
    }
    if (file.size < 1024 * 1024) {
      return `${(file.size / 1024).toFixed(2)} KB`;
    }
    return `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }

  return (
    <Link href={file.url} target="_blank" rel="noopener noreferrer">
      <Card>
        <CardHeader>
          <CardTitle className="text-md line-clamp-2 text-wrap">
            {file.name}
          </CardTitle>
          <CardDescription className="flex flex-col gap-1">
            <span>
              {printType()} · {printSize()}
            </span>
            <span>{file.uploadedBy.name}</span>
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <FilePreviewContent file={file} />
        </CardFooter>
      </Card>
    </Link>
  );
}

function FilePreviewContent({ file }: { file: File }) {
  if (file.type === "image") {
    return (
      <Image
        src={file.url}
        alt={file.name}
        width={350}
        height={350}
        className="aspect-square"
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
