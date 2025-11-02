import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export default function LoadingPage({ children }: { children?: ReactNode }) {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="mt-1 font-semibold text-xl">{children}</h1>
      </div>

      <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    </div>
  );
}
