"use client";

import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { GiftIdeaData } from "@/app/_data/secret-santa";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

export default function AssignmentGiftIdeas({
  giftIdeas,
  userName,
}: {
  giftIdeas: GiftIdeaData[];
  userName: string;
}) {
  const t = useTranslations("secretSanta");

  if (giftIdeas.length === 0) {
    return (
      <p className="text-muted-foreground italic">
        {t("matchIdeasIntro", { name: userName })}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {giftIdeas.map((giftIdea) => (
        <li key={giftIdea.id}>
          <Item variant="card">
            <ItemContent>
              <ItemTitle>{giftIdea.name}</ItemTitle>
              <ItemDescription>
                <span className="block">{giftIdea.description}</span>

                {giftIdea.url && (
                  <Link
                    href={giftIdea.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-row items-center gap-2 text-muted-foreground"
                  >
                    <ExternalLinkIcon className="size-4 shrink-0" />
                    <span className="wrap-anywhere line-clamp-1 text-sm">
                      {giftIdea.url}
                    </span>
                  </Link>
                )}
              </ItemDescription>
            </ItemContent>
          </Item>
        </li>
      ))}
    </ul>
  );
}
