"use client";

import { Slot } from "@radix-ui/react-slot";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  forwardRef,
} from "react";

type TriggerOrigin = {
  x: number;
  y: number;
};

function getTriggerOrigin(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const rect = target.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  } satisfies TriggerOrigin;
}

export function getDialogTransformOriginStyle(
  origin: TriggerOrigin | null,
): CSSProperties | undefined {
  if (!origin) {
    return undefined;
  }

  return {
    "--dialog-trigger-origin-x": `${origin.x}px`,
    "--dialog-trigger-origin-y": `${origin.y}px`,
    transformOrigin:
      "calc(var(--dialog-trigger-origin-x) - (50vw - 50%)) calc(var(--dialog-trigger-origin-y) - (50vh - 50%))",
  } as CSSProperties;
}

type TriggerOriginSlotProps = ComponentPropsWithoutRef<typeof Slot> & {
  onOriginChange?: (origin: TriggerOrigin | null) => void;
};

export const TriggerOriginSlot = forwardRef<
  ElementRef<typeof Slot>,
  TriggerOriginSlotProps
>(({ onClick, onKeyDown, onOriginChange, ...props }, ref) => {
  return (
    <Slot
      ref={ref}
      onClick={(event) => {
        onOriginChange?.(getTriggerOrigin(event.currentTarget));
        onClick?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onOriginChange?.(getTriggerOrigin(event.currentTarget));
        }
        onKeyDown?.(event);
      }}
      {...props}
    />
  );
});
TriggerOriginSlot.displayName = "TriggerOriginSlot";
