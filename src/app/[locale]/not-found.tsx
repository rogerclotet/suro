"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");

  useEffect(() => {
    posthog.captureException("Not found", {
      path: pathname,
    });
  }, [pathname]);

  return (
    <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{tCommon("error")}</AlertTitle>
        <AlertDescription>
          <p>{tErrors("notFound")}</p>
          <div className="mt-4">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft />
                {tErrors("backHome")}
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
