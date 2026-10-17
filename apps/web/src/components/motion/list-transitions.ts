import type { Transition } from "motion/react";

/** Rows sliding to a new slot; the same spring as mobile's ITEM_TRANSITION. */
export const ROW_LAYOUT_TRANSITION: Transition = {
  type: "spring",
  damping: 24,
  stiffness: 220,
  mass: 0.9,
};

const INSTANT_EXIT = { opacity: 0, transition: { duration: 0 } } as const;

/** Enter/exit for a list row, matching mobile's 160 ms fades. */
export const ROW_PRESENCE = {
  initial: "hidden",
  animate: "shown",
  exit: "hidden",
  variants: {
    hidden: { opacity: 0, scale: 0.98 },
    shown: { opacity: 1, scale: 1 },
  },
  transition: {
    layout: ROW_LAYOUT_TRANSITION,
    default: { duration: 0.16, ease: "easeOut" },
  },
} as const;

/** Enter/exit for a category section or its heading. */
export const SECTION_PRESENCE = {
  initial: "hidden",
  animate: "shown",
  exit: "hidden",
  variants: {
    hidden: { opacity: 0 },
    shown: { opacity: 1 },
  },
  transition: {
    layout: ROW_LAYOUT_TRANSITION,
    default: { duration: 0.2, ease: "easeOut" },
  },
} as const;

/**
 * ROW_PRESENCE for a row that can be dragged into another section. The dropped
 * row is already under the pointer at its new slot, so it neither fades in
 * there nor leaves a fading copy behind: `droppedItemId` names it at mount,
 * and AnimatePresence's `custom` names it when its old copy exits.
 */
export function draggableRowPresence(
  itemId: string,
  droppedItemId: string | null,
) {
  return {
    ...ROW_PRESENCE,
    initial: droppedItemId === itemId ? false : "hidden",
    exit: "gone",
    variants: {
      ...ROW_PRESENCE.variants,
      gone: (dropped: string | null) =>
        dropped === itemId ? INSTANT_EXIT : ROW_PRESENCE.variants.hidden,
    },
  } as const;
}

/**
 * SECTION_PRESENCE for a drop-target section: one emptied by dropping its
 * last row elsewhere disappears at once, like the row in
 * `draggableRowPresence`.
 */
export function droppableSectionPresence(itemIds: readonly string[]) {
  return {
    ...SECTION_PRESENCE,
    exit: "gone",
    variants: {
      ...SECTION_PRESENCE.variants,
      gone: (dropped: string | null) =>
        itemIds.length === 1 && itemIds[0] === dropped
          ? INSTANT_EXIT
          : SECTION_PRESENCE.variants.hidden,
    },
  } as const;
}
