import { Loader2 } from "lucide-react";

export default function LoadingPage() {
  return (
    <div>
      <span className="sr-only">Carregant...</span>
      <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    </div>
  );
}
