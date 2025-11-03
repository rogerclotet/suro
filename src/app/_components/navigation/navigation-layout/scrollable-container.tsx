"use client";

import { type ReactNode, useCallback, useEffect, useRef } from "react";

export type ScrollState = {
  isAtTop: boolean;
  isAtBottom: boolean;
};

type ScrollableContainerProps = {
  children: ReactNode;
  className?: string;
  onScrollStateChange?: (state: ScrollState) => void;
};

const TOP_THRESHOLD = 5.0;
const BOTTOM_THRESHOLD = 5.0;

export function ScrollableContainer({
  children,
  className,
  onScrollStateChange,
}: ScrollableContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousStateRef = useRef<ScrollState>({
    isAtTop: true,
    isAtBottom: false,
  });
  const callbackRef = useRef(onScrollStateChange);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = onScrollStateChange;
  }, [onScrollStateChange]);

  // Calculate scroll state - memoized since it only uses refs
  const calculateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const { scrollTop, scrollHeight, clientHeight } = element;

    // Check if scrolled to top (with small threshold for floating point precision)
    const atTop = scrollTop <= TOP_THRESHOLD;

    // Check if scrolled to bottom - more precise calculation
    // The scroll is at the bottom when scrollTop + clientHeight equals or exceeds scrollHeight
    // Use a very small threshold (0.5px) to account for subpixel rendering while being strict
    const scrollBottom = scrollTop + clientHeight;
    const distanceFromBottom = scrollHeight - scrollBottom;
    const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

    // Notify callback if state changed
    const prev = previousStateRef.current;
    if (prev.isAtTop !== atTop || prev.isAtBottom !== atBottom) {
      const newState = { isAtTop: atTop, isAtBottom: atBottom };
      previousStateRef.current = newState;
      callbackRef.current?.(newState);
    }
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      calculateScrollState();
    };

    // Initial check after a brief delay to ensure layout is complete
    const initialCheck = () => {
      // Use requestAnimationFrame to ensure layout is settled
      requestAnimationFrame(() => {
        calculateScrollState();
      });
    };

    initialCheck();

    element.addEventListener("scroll", handleScroll, { passive: true });

    // Also check on resize in case content changes
    const resizeObserver = new ResizeObserver(() => {
      // Use a small delay to ensure scrollHeight is updated
      requestAnimationFrame(calculateScrollState);
    });
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [calculateScrollState]);

  // Recalculate scroll state when children change (e.g., page navigation)
  // We use a MutationObserver to detect when the DOM content actually changes,
  // which is more reliable than depending on the children prop reference
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Use MutationObserver to detect content changes
    const mutationObserver = new MutationObserver(() => {
      // Wait for layout to settle after DOM changes
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          calculateScrollState();
        });
      });
    });

    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
    });

    // Also check after initial render
    requestAnimationFrame(() => {
      calculateScrollState();
    });

    return () => {
      mutationObserver.disconnect();
    };
  }, [calculateScrollState]);

  return (
    <div ref={scrollRef} className={className}>
      {children}
    </div>
  );
}
