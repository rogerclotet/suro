import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <Alert variant="destructive" className="mx-auto mt-20 max-w-lg">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{"No s'ha trobat la pàgina."}</AlertDescription>
    </Alert>
  );
}
