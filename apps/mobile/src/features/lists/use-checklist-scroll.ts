import { type RefObject, useEffect, useRef } from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { DropProviderRef } from "react-native-reanimated-dnd";

// Auto-scroll while a dragged row nears a screen edge, so categories above or
// below the fold come into reach. The zone is the band (in px) inside each
// viewport edge that arms scrolling; speed ramps from MIN at the band's inner
// boundary to MAX at the edge itself, both in px per animation frame. The inset
// approximates half a row so the row's center — not its top — drives detection.
const AUTO_SCROLL_EDGE = 90;
const AUTO_SCROLL_MIN_SPEED = 3;
const AUTO_SCROLL_MAX_SPEED = 18;
const DRAG_POINT_INSET = 24;

/** px/frame to auto-scroll given how far the row pushed past a zone boundary. */
function edgeAutoScrollSpeed(penetration: number): number {
  const ratio = Math.min(1, Math.max(0, penetration) / AUTO_SCROLL_EDGE);
  return (
    AUTO_SCROLL_MIN_SPEED +
    ratio * (AUTO_SCROLL_MAX_SPEED - AUTO_SCROLL_MIN_SPEED)
  );
}

export function useChecklistScroll(
  embedded: boolean,
  externalScrollRef?: RefObject<ScrollView | null>,
) {
  const dropProviderRef = useRef<DropProviderRef>(null);
  const lastPositionUpdate = useRef(0);
  // Auto-scroll while dragging toward a screen edge. `onDragging` reports the
  // lifted row's window position; once it enters an edge zone a rAF loop nudges
  // the ScrollView. Because the row lives inside that ScrollView, the loop also
  // feeds `autoScrollComp` an equal counter-translation so the row stays pinned
  // under the finger instead of sliding off with the content — and so the drop,
  // which the dnd library resolves from the row's frozen drag origin, lands
  // where the row visually sits. `scrollOffset`/`contentHeight`/the viewport
  // rect are the bookkeeping the loop needs to clamp and place each step.
  const ownScrollRef = useRef<ScrollView>(null);
  const scrollRef =
    embedded && externalScrollRef ? externalScrollRef : ownScrollRef;
  const scrollOffset = useRef(0);
  const contentHeight = useRef(0);
  const viewportTop = useRef(0);
  const viewportHeight = useRef(0);
  const autoScrollDir = useRef<-1 | 0 | 1>(0);
  const autoScrollSpeed = useRef(0);
  const autoScrollFrame = useRef<number | null>(null);
  const autoScrollComp = useSharedValue(0);

  // Cancel an in-flight auto-scroll loop if the screen unmounts mid-drag.
  useEffect(() => {
    return () => {
      if (autoScrollFrame.current !== null) {
        cancelAnimationFrame(autoScrollFrame.current);
      }
    };
  }, []);

  function refreshDropPositions() {
    dropProviderRef.current?.requestPositionUpdate();
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    // Track the resting offset so auto-scroll has an accurate base to build on.
    scrollOffset.current = e.nativeEvent.contentOffset.y;
    const now = Date.now();
    if (now - lastPositionUpdate.current > 100) {
      lastPositionUpdate.current = now;
      refreshDropPositions();
    }
  }

  // Capture the scroll viewport's window rect (it sits below the navigation
  // header) so edge detection can compare the dragged row's window position
  // against the visible area. Re-measured on layout and at each drag start.
  function measureViewport() {
    scrollRef.current?.getNativeScrollRef()?.measureInWindow((_x, y, _w, h) => {
      viewportTop.current = y;
      viewportHeight.current = h;
    });
  }

  function stopAutoScroll() {
    if (autoScrollFrame.current !== null) {
      cancelAnimationFrame(autoScrollFrame.current);
      autoScrollFrame.current = null;
    }
    autoScrollDir.current = 0;
    autoScrollSpeed.current = 0;
  }

  function autoScrollStep() {
    const dir = autoScrollDir.current;
    if (dir === 0) {
      autoScrollFrame.current = null;
      return;
    }
    const maxOffset = Math.max(
      0,
      contentHeight.current - viewportHeight.current,
    );
    const next = Math.min(
      maxOffset,
      Math.max(0, scrollOffset.current + dir * autoScrollSpeed.current),
    );
    const delta = next - scrollOffset.current;
    // Reached the top or bottom of the content: idle until the finger moves
    // again (the next onDragging restarts the loop).
    if (delta === 0) {
      autoScrollFrame.current = null;
      return;
    }
    scrollOffset.current = next;
    scrollRef.current?.scrollTo({ y: next, animated: false });
    // Keep the lifted row under the finger, and refresh the drop zones that
    // just moved with the page so the hovered target and the release resolve
    // against where the categories are now.
    autoScrollComp.value += delta;
    refreshDropPositions();
    autoScrollFrame.current = requestAnimationFrame(autoScrollStep);
  }

  // Called continuously while a row is dragged. Picks an auto-scroll direction
  // and speed from how far the row's center has pushed into an edge zone, then
  // makes sure the loop is running.
  function handleDragging({ y, ty }: { y: number; ty: number }) {
    if (viewportHeight.current === 0) {
      return;
    }
    const center = y + ty + DRAG_POINT_INSET;
    const topZone = viewportTop.current + AUTO_SCROLL_EDGE;
    const bottomZone =
      viewportTop.current + viewportHeight.current - AUTO_SCROLL_EDGE;
    if (center < topZone) {
      autoScrollDir.current = -1;
      autoScrollSpeed.current = edgeAutoScrollSpeed(topZone - center);
    } else if (center > bottomZone) {
      autoScrollDir.current = 1;
      autoScrollSpeed.current = edgeAutoScrollSpeed(center - bottomZone);
    } else {
      autoScrollDir.current = 0;
      autoScrollSpeed.current = 0;
    }
    if (autoScrollDir.current !== 0 && autoScrollFrame.current === null) {
      autoScrollFrame.current = requestAnimationFrame(autoScrollStep);
    }
  }

  return {
    scrollRef,
    dropProviderRef,
    contentHeight,
    autoScrollComp,
    handleScroll,
    handleDragging,
    measureViewport,
    stopAutoScroll,
    refreshDropPositions,
  };
}
