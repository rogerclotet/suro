import { ExternalLinkIcon } from "lucide-react";
import type { GiftIdea } from "@/app/_data/secret-santa";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";

export default function GiftIdeaContent({ giftIdea }: { giftIdea: GiftIdea }) {
  return (
    <ItemContent>
      <ItemTitle>{giftIdea.name}</ItemTitle>
      <ItemDescription className="space-y-1">
        {giftIdea.description && (
          <span className="block whitespace-pre-line">
            {giftIdea.description}
          </span>
        )}
        {giftIdea.url && (
          <a
            href={giftIdea.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-row items-center gap-2 text-muted-foreground"
          >
            <ExternalLinkIcon className="size-4 shrink-0" />
            <span className="wrap-anywhere line-clamp-1 text-sm">
              {giftIdea.url}
            </span>
          </a>
        )}
      </ItemDescription>
    </ItemContent>
  );
}
