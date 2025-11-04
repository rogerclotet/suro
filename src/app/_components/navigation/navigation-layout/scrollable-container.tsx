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

    // Handle touch events for mobile momentum scrolling
    // iOS Safari doesn't fire scroll events during momentum scrolling
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastScrollTop = element.scrollTop;
    let momentumCheckCount = 0;

    const handleTouchMove = () => {
      // Check scroll state during touch move
      calculateScrollState();
      lastScrollTop = element.scrollTop;
    };

    const handleTouchEnd = () => {
      // Check scroll state after touch ends
      calculateScrollState();
      lastScrollTop = element.scrollTop;
      momentumCheckCount = 0;

      // Clear any existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Check periodically after touch ends to catch momentum scrolling
      // This helps with iOS Safari momentum scrolling
      const checkMomentum = () => {
        const currentScrollTop = element.scrollTop;

        // If scroll position changed, we're still in momentum scrolling
        if (Math.abs(currentScrollTop - lastScrollTop) > 0.5) {
          calculateScrollState();
          lastScrollTop = currentScrollTop;
          momentumCheckCount++;

          // Continue checking if we haven't exceeded max attempts
          if (momentumCheckCount < 20) {
            // Check for up to 1 second (20 * 50ms)
            scrollTimeout = setTimeout(checkMomentum, 50);
          } else {
            scrollTimeout = null;
          }
        } else {
          // Scroll position hasn't changed, momentum has stopped
          scrollTimeout = null;
        }
      };

      // Start checking after a short delay
      scrollTimeout = setTimeout(checkMomentum, 16);
    };

    // Initial check after a brief delay to ensure layout is complete
    const initialCheck = () => {
      // Use requestAnimationFrame to ensure layout is settled
      requestAnimationFrame(() => {
        calculateScrollState();
      });
    };

    initialCheck();

    // Add scroll event listener
    element.addEventListener("scroll", handleScroll, { passive: true });

    // Add touch event listeners for mobile momentum scrolling
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    // Also check on resize in case content changes
    const resizeObserver = new ResizeObserver(() => {
      // Use a small delay to ensure scrollHeight is updated
      requestAnimationFrame(calculateScrollState);
    });
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", handleScroll);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      resizeObserver.disconnect();
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
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
    <div
      ref={scrollRef}
      className={className}
      style={
        {
          // Enable momentum scrolling on iOS Safari
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
