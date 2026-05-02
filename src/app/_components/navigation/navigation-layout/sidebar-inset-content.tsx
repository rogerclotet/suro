"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useAction } from "@/app/_state/action-state";
import { FAB } from "@/components/ui/fab";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import BottomNav from "./bottom-nav";
import Breadcrumbs from "./breadcrumbs";
import { ScrollableContainer } from "./scrollable-container";
import SubsectionTabs from "./subsection-tabs";

export default function SidebarInsetContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useSidebar();
  const { action } = useAction();

  const headerRef = useRef<HTMLElement>(null);
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const bottomNavWrapperRef = useRef<HTMLDivElement>(null);
  const fabWrapperRef = useRef<HTMLDivElement>(null);
  const [topOffset, setTopOffset] = useState(0);
  const [bottomOffset, setBottomOffset] = useState(0);
  const [tabsTop, setTabsTop] = useState(0);
  const [fabHeight, setFabHeight] = useState(0);

  useLayoutEffect(() => {
    if (!isMobile) return;

    const updateLayout = () => {
      const headerH = headerRef.current?.offsetHeight ?? 0;
      const tabsH = tabsWrapperRef.current?.offsetHeight ?? 0;
      const bottomH = bottomNavWrapperRef.current?.offsetHeight ?? 0;
      setTabsTop(headerH);
      setTopOffset(headerH + tabsH);
      setBottomOffset(bottomH);
    };

    updateLayout();
    const ro = new ResizeObserver(updateLayout);
    if (headerRef.current) ro.observe(headerRef.current);
    if (tabsWrapperRef.current) ro.observe(tabsWrapperRef.current);
    if (bottomNavWrapperRef.current) ro.observe(bottomNavWrapperRef.current);
    return () => ro.disconnect();
  }, [isMobile]);

  useLayoutEffect(() => {
    if (!action) return;
    const el = fabWrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setFabHeight(fabWrapperRef.current?.offsetHeight ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [action]);

  // Extra bottom padding so content scrolls clear of the FAB.
  // On mobile the FAB sits 16px above the bottom nav; on desktop it's 16px from the bottom edge.
  const FAB_GAP = 16;
  const FAB_MARGIN = 8;
  const fabClearance = action ? fabHeight + FAB_GAP + FAB_MARGIN : 0;

  if (isMobile) {
    return (
      <div className="relative h-full overflow-hidden">
        <ScrollableContainer
          className="h-full overflow-y-auto px-3"
          style={{
            paddingTop: topOffset + 12,
            paddingBottom: bottomOffset + 12 + fabClearance,
          }}
        >
          {children}
        </ScrollableContainer>

        <header
          ref={headerRef}
          className="absolute inset-x-0 top-0 z-20 flex min-h-[52px] items-center gap-2 bg-sidebar/85 px-4 pb-2.5 text-sidebar-foreground backdrop-blur-md"
          style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
        >
          <Breadcrumbs />
        </header>

        <div
          ref={tabsWrapperRef}
          className="absolute inset-x-0 z-20"
          style={{ top: tabsTop }}
        >
          <SubsectionTabs />
        </div>

        {action && (
          <div
            ref={fabWrapperRef}
            className="absolute right-4 z-20"
            style={{ bottom: bottomOffset + FAB_GAP }}
          >
            <FAB
              key={action.label}
              label={action.label}
              icon={action.icon}
              onClick={action.onClick ?? undefined}
              elevation="high"
            />
          </div>
        )}

        <div
          ref={bottomNavWrapperRef}
          className="absolute inset-x-0 bottom-0 z-20"
        >
          <BottomNav />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header
        className={cn(
          "z-10 flex shrink-0 items-center gap-2 bg-sidebar px-4 text-sidebar-foreground transition-[width,height] duration-200 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:h-16 md:rounded-t-lg md:bg-background md:px-6 md:text-foreground",
        )}
      >
        <Breadcrumbs />
        <div className="ml-auto">
          <OfflineIndicator />
        </div>
      </header>

      <SubsectionTabs />

      <div className="relative grow overflow-hidden">
        <ScrollableContainer
          className="h-full overflow-y-auto p-3 md:px-6 md:py-2"
          style={action ? { paddingBottom: fabClearance } : undefined}
        >
          {children}
        </ScrollableContainer>

        {action && (
          <div ref={fabWrapperRef} className="absolute right-4 bottom-4 z-20">
            <FAB
              key={action.label}
              label={action.label}
              icon={action.icon}
              onClick={action.onClick ?? undefined}
              elevation="high"
            />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
