import { Loader2 } from "lucide-react";

export default function LoadingPage({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="mt-1 text-xl font-semibold">{children}</h1>
      </div>

      <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    </div>
  );
}
