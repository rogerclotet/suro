import type { File } from "@/app/_data/file";
import FileCard from "./file-card";

export default function GridView({ files }: { files: File[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
      {files.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}
