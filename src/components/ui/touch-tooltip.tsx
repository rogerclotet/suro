"use client";

import type {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from "@radix-ui/react-popover";
import type {
  TooltipContentProps,
  TooltipProps,
  TooltipProviderProps,
  TooltipTriggerProps,
} from "@radix-ui/react-tooltip";
import { createContext, useContext, useSyncExternalStore } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Tooltip as OriginalTooltip,
  TooltipContent as OriginalTooltipContent,
  TooltipProvider as OriginalTooltipProvider,
  TooltipTrigger as OriginalTooltipTrigger,
} from "./tooltip";

const TouchContext = createContext<boolean>(false);
const useTouch = () => useContext(TouchContext);

export const TooltipProvider = ({
  children,
  ...props
}: TooltipProviderProps) => {
  const isTouch = useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );

  return (
    <TouchContext.Provider value={isTouch}>
      <OriginalTooltipProvider {...props}>{children}</OriginalTooltipProvider>
    </TouchContext.Provider>
  );
};

export const Tooltip = (props: TooltipProps & PopoverProps) => {
  const isTouch = useTouch();

  return isTouch ? <Popover {...props} /> : <OriginalTooltip {...props} />;
};

export const TooltipTrigger = (
  props: TooltipTriggerProps & PopoverTriggerProps,
) => {
  const isTouch = useTouch();

  return isTouch ? (
    <PopoverTrigger {...props} />
  ) : (
    <OriginalTooltipTrigger {...props} />
  );
};

export const TooltipContent = (
  props: TooltipContentProps & PopoverContentProps,
) => {
  const isTouch = useTouch();

  return isTouch ? (
    <PopoverContent {...props} />
  ) : (
    <OriginalTooltipContent {...props} />
  );
};
