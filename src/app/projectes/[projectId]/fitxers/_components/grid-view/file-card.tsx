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
import { readableSize } from "../../readable-size";

export default function FileCard({ file }: { file: File }) {
  return (
    <Link href={file.url} target="_blank" rel="noopener noreferrer">
      <Card>
        <CardHeader>
          <CardTitle className="text-md line-clamp-1 truncate text-wrap">
            {file.name}
          </CardTitle>
          <CardDescription className="flex flex-col gap-1">
            {file.uploadedBy.name} · {readableSize(file.size)}
          </CardDescription>
        </CardHeader>
        <CardFooter className="aspect-square">
          <FilePreviewContent file={file} />
        </CardFooter>
      </Card>
    </Link>
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
