"use client";

import { FileText } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { readableSize } from "@/app/[locale]/groups/[projectId]/files/readable-size";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { demoFileKeys } from "../_data/mock";

export default function FilesNotesDemo() {
  const t = useTranslations("info");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("demoFilesNoteTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextContent
            format="html"
            content={t.raw("demoFilesNoteContent") as string}
            className="text-sm"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("demoFilesSectionFiles")}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <ul>
            {demoFileKeys.map((file) => (
              <li
                key={file.id}
                className="flex h-14 items-center gap-4 not-last:border-background not-last:border-b-2 px-4"
              >
                <div className="flex w-10 shrink-0 items-center justify-center">
                  {file.type.startsWith("image/") ? (
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Image
                      src="/pdf.svg"
                      alt=""
                      width={32}
                      height={32}
                      className="aspect-square"
                    />
                  )}
                </div>
                <div className="flex min-w-0 grow flex-col">
                  <span className="truncate text-sm">{t(file.name)}</span>
                  <span className="text-muted-foreground text-xs">
                    {readableSize(file.size)}
                  </span>
                </div>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {t("demoFilesUploadedBy", { name: file.uploadedByName })}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
