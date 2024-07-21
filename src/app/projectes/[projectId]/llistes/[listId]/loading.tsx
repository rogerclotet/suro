import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="mt-1 text-xl font-semibold">
          <span className="sr-only">Carregant...</span>
        </h1>
      </div>

      <div className="flex h-[300px] w-full items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    </div>
  );
}
