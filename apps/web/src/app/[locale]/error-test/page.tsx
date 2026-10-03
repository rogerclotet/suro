import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ClientErrorButton from "@/app/[locale]/error-test/client-error-button";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

async function triggerServerError() {
  "use server";

  throw new Error("Suro server error reporting test");
}

export default async function ErrorTestPage() {
  const t = await getTranslations("errorTest");

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-16">
      <h1 className="font-display text-2xl">{t("title")}</h1>
      <div className="flex flex-wrap gap-3">
        <ClientErrorButton />
        <form action={triggerServerError}>
          <Button type="submit" variant="outline">
            {t("serverError")}
          </Button>
        </form>
      </div>
    </main>
  );
}
