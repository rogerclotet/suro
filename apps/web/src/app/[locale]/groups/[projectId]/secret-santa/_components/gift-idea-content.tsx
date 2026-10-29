import { giftLinkLabel } from "domain/secret-santa";
import { ExternalLinkIcon } from "lucide-react";
import type { GiftIdea } from "@/app/_data/secret-santa";
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";

export default function GiftIdeaContent({ giftIdea }: { giftIdea: GiftIdea }) {
  return (
    <ItemContent>
      <ItemTitle>{giftIdea.name}</ItemTitle>
      {/* The whole wish matters to the giver, so it isn't clamped, and the
          link sits outside it so a long description can't hide it. */}
      {giftIdea.description && (
        <ItemDescription className="line-clamp-none whitespace-pre-line">
          {giftIdea.description}
        </ItemDescription>
      )}
      {giftIdea.url && (
        <a
          href={giftIdea.url}
          target="_blank"
          rel="noopener noreferrer"
          title={giftIdea.url}
          className="inline-flex max-w-full items-center gap-1.5 self-start rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-primary hover:underline"
        >
          <ExternalLinkIcon className="size-3.5 shrink-0" />
          <span className="truncate">{giftLinkLabel(giftIdea.url)}</span>
        </a>
      )}
    </ItemContent>
  );
}
