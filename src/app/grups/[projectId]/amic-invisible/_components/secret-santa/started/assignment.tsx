"use client";

import { BadgeQuestionMarkIcon } from "lucide-react";
import { useState } from "react";
import type { User } from "@/app/_data/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Assignment({ user }: { user: User }) {
  const [isFlipped, setIsFlipped] = useState(false);

  function handleFlip() {
    setIsFlipped(!isFlipped);
  }

  return (
    <div className="flex items-center justify-center">
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
            <AssignmentCardBack />
          </div>
          <div className="backface-hidden transform-[rotateY(180deg)] absolute inset-0 size-full">
            <AssignmentCardFront user={user} />
          </div>
        </div>
      </button>
    </div>
  );
}

function AssignmentCardFront({ user }: { user: User }) {
  return (
    <Card className="flex aspect-3/4 w-full flex-col items-stretch justify-evenly drop-shadow-2xl">
      <CardHeader className="flex h-auto w-full items-center justify-center">
        <Avatar className="aspect-square h-auto w-[80%]">
          <AvatarFallback className="text-8xl">
            {user.name?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
          <AvatarImage src={user.image ?? undefined} />
        </Avatar>
      </CardHeader>
      <CardContent className="flex h-16 items-center justify-center">
        <span className="line-clamp-2 text-ellipsis font-bold text-2xl text-primary">
          {user.name}
        </span>
      </CardContent>
    </Card>
  );
}

function AssignmentCardBack() {
  return (
    <Card className="flex aspect-3/4 w-full flex-col items-center justify-evenly drop-shadow-2xl">
      <CardHeader className="flex h-auto w-full items-center justify-center">
        <BadgeQuestionMarkIcon className="aspect-square h-auto w-[80%] text-muted" />
      </CardHeader>
      <CardContent className="flex h-16 items-center justify-center text-center text-muted-foreground">
        Toca per veure el teu amic invisible
      </CardContent>
    </Card>
  );
}
