"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogger } from "next-axiom";
import { LogLevel } from "next-axiom/dist/logger";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const pathname = usePathname();
  const log = useLogger({ source: "error.tsx" });

  React.useEffect(() => {
    log.logHttpRequest(
      LogLevel.error,
      "Not found",
      {
        host: window.location.href,
        path: pathname,
        statusCode: status,
      },
      {},
    );
  }, [log.logHttpRequest, pathname]);

  return (
    <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          <p>{"No s'ha trobat la pàgina."}</p>
          <div className="mt-4">
            <Link href="/">
              <Button variant="neutral" className="gap-2">
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
