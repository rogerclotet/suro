import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkAuth } from "@/lib/check-auth";
import { getNote } from "@/server/notes";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; noteId: string }>;
}) {
  const { noteId } = await params;

  await checkAuth();

  const note = await getNote(noteId);
  if (!note) {
    return (
      <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>{"No s'ha trobat la nota."}</p>
            <div className="mt-4">
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft />
                  {"Tornar a l'inici"}
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-semibold text-xl">{note.name}</h1>
      </div>
      <p className="whitespace-pre-line">{note.contents}</p>
    </div>
  );
}
