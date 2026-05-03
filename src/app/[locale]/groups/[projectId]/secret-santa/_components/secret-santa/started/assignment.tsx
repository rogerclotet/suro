"use client";

import { BadgeQuestionMarkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { User } from "@/app/_data/user";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import UserAvatar from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import type { getAssignment } from "@/server/secret-santa";
import AssignmentGiftIdeas from "./assignment-gift-ideas";

export default function Assignment({
  assignment,
}: {
  assignment: NonNullable<Awaited<ReturnType<typeof getAssignment>>>;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const t = useTranslations("secretSanta");

  function handleFlip() {
    setIsFlipped(!isFlipped);
  }

  return (
    <div className="columns-1 gap-4 space-y-4 lg:columns-2">
      <div className="flex items-center justify-center py-12">
        <button
          type="button"
          onClick={handleFlip}
          className="perspective-[100rem] aspect-3/4 h-auto w-[60%] min-w-[200px] max-w-[300px] cursor-pointer"
        >
          <div
            className={cn(
              "transform-3d relative size-full transition duration-500 ease-in-out",
              isFlipped ? "rotate-y-180" : "",
            )}
          >
            <div className="backface-hidden absolute inset-0 size-full">
              <AssignmentCardBack tapToReveal={t("tapToReveal")} />
            </div>
            <div className="backface-hidden transform-[rotateY(180deg)] absolute inset-0 size-full">
              <AssignmentCardFront user={assignment.user} />
            </div>
          </div>
        </button>
      </div>

      {isFlipped && (
        <div className="fade-in-0 [sm,md]:slide-in-from-top-5 lg:slide-in-from-left-5 animate-in space-y-4 duration-500">
          <h4 className="font-semibold">{t("giftIdeas")}</h4>
          <AssignmentGiftIdeas giftIdeas={assignment.giftIdeas} />
        </div>
      )}
    </div>
  );
}

function AssignmentCardFront({ user }: { user: User }) {
  return (
    <Card className="flex aspect-3/4 w-full flex-col items-stretch justify-evenly drop-shadow-2xl">
      <CardHeader className="flex h-auto w-full items-center justify-center">
        <UserAvatar
          user={user}
          className="aspect-square h-auto w-[80%] text-8xl"
        />
      </CardHeader>
      <CardContent className="flex h-16 items-center justify-center">
        <span className="line-clamp-2 text-ellipsis font-bold text-2xl text-primary">
          {user.name}
        </span>
      </CardContent>
    </Card>
  );
}

function AssignmentCardBack({ tapToReveal }: { tapToReveal: string }) {
  return (
    <Card className="flex aspect-3/4 w-full flex-col items-center justify-evenly drop-shadow-2xl">
      <CardHeader className="flex h-auto w-full items-center justify-center">
        <BadgeQuestionMarkIcon className="aspect-square h-auto w-[80%] text-muted" />
      </CardHeader>
      <CardContent className="flex h-16 items-center justify-center text-center text-muted-foreground">
        {tapToReveal}
      </CardContent>
    </Card>
  );
}
