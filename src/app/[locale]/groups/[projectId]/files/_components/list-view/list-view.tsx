import type { File } from "@/app/_data/file";
import FileListItem from "./file-list-item";

export default function ListView({ files }: { files: File[] }) {
  return (
    <ul className="mx-auto max-w-3xl overflow-hidden rounded-lg bg-card">
      {files.map((file) => (
        <FileListItem key={file.id} file={file} />
      ))}
    </ul>
  );
}
