"use client";

import { BadgeQuestionMarkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { SecretSanta } from "@/app/_data/secret-santa";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Item } from "@/components/ui/item";
import UserAvatar from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import GiftIdeaContent from "./gift-idea-content";
import { SectionLabel } from "./layout";

type AssignmentData = NonNullable<SecretSanta["assignment"]>;

/** A face-down card the participant flips to see who they drew. */
export default function Assignment({
  assignment,
}: {
  assignment: AssignmentData;
}) {
  const [revealed, setRevealed] = useState(false);
  const t = useTranslations("secretSanta");
  const name = assignment.name ?? t("unnamedMember");

  return (
    <div className="columns-1 gap-4 space-y-4 lg:columns-2">
      <div className="flex break-inside-avoid items-center justify-center py-6">
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          aria-label={revealed ? t("hideMatch") : t("tapToReveal")}
          className="aspect-3/4 h-auto w-[60%] max-w-[300px] min-w-[200px] cursor-pointer perspective-[100rem]"
        >
          <div
            className={cn(
              "relative size-full transition duration-500 ease-in-out transform-3d",
              revealed && "rotate-y-180",
            )}
          >
            <div className="absolute inset-0 size-full backface-hidden">
              <Card className="flex aspect-3/4 w-full flex-col items-center justify-evenly drop-shadow-md">
                <CardHeader className="flex h-auto w-full items-center justify-center">
                  <BadgeQuestionMarkIcon className="aspect-square h-auto w-[80%] text-muted" />
                </CardHeader>
                <CardContent className="flex h-16 items-center justify-center text-center text-muted-foreground">
                  {t("tapToReveal")}
                </CardContent>
              </Card>
            </div>
            <div className="absolute inset-0 size-full transform-[rotateY(180deg)] backface-hidden">
              <Card className="flex aspect-3/4 w-full flex-col items-stretch justify-evenly drop-shadow-md">
                <CardHeader className="flex h-auto w-full items-center justify-center">
                  <UserAvatar
                    user={assignment}
                    className="aspect-square h-auto w-[80%] text-8xl"
                  />
                </CardHeader>
                <CardContent className="flex h-16 items-center justify-center">
                  <span className="line-clamp-2 text-2xl font-bold text-ellipsis text-primary">
                    {name}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        </button>
      </div>

      {revealed && (
        <div className="animate-in break-inside-avoid space-y-4 duration-500 fade-in-0 lg:slide-in-from-left-5">
          <h3 className="font-display text-xl font-semibold">
            {t("yourMatch", { name })}
          </h3>
          <section className="space-y-1">
            <SectionLabel
              count={
                assignment.giftIdeas.length > 0
                  ? assignment.giftIdeas.length
                  : undefined
              }
            >
              {t("giftIdeas")}
            </SectionLabel>
            {assignment.giftIdeas.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                {t("matchIdeasIntro", { name })}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {assignment.giftIdeas.map((giftIdea) => (
                  <li key={giftIdea.id}>
                    <Item className="px-0 py-3">
                      <GiftIdeaContent giftIdea={giftIdea} />
                    </Item>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
