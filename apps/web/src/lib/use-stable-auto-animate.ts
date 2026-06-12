"use client";

import { type AnimationController, autoAnimate } from "@formkit/auto-animate";
import { useCallback, useRef } from "react";

/**
 * `useAutoAnimate` fires the callback ref twice in React Strict Mode (dev),
 * creating duplicate MutationObservers that cancel each other's FLIP
 * animations. This hook prevents double-initialization by tracking the
 * controller and calling destroy() on cleanup.
 */
export function useStableAutoAnimate<T extends HTMLElement>() {
  const controllerRef = useRef<AnimationController | null>(null);
  return useCallback((node: T | null) => {
    if (node && !controllerRef.current) {
      controllerRef.current = autoAnimate(node);
    } else if (!node && controllerRef.current) {
      controllerRef.current.destroy?.();
      controllerRef.current = null;
    }
  }, []);
}
