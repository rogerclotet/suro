"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useAction } from "@/app/_state/action-state";
import { FAB } from "@/components/ui/fab";
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
  const [topOffset, setTopOffset] = useState(0);
  const [bottomOffset, setBottomOffset] = useState(0);
  const [tabsTop, setTabsTop] = useState(0);

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

  if (isMobile) {
    return (
      <div className="relative h-full overflow-hidden">
        <ScrollableContainer
          className="h-full overflow-y-auto px-3"
          style={{
            paddingTop: topOffset + 12,
            paddingBottom: bottomOffset + 12,
          }}
        >
          {children}
        </ScrollableContainer>

        <header
          ref={headerRef}
          className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 bg-sidebar/85 px-4 py-2.5 text-sidebar-foreground backdrop-blur-md"
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
            className="absolute right-4 z-20"
            style={{ bottom: bottomOffset + 16 }}
          >
            <FAB
              key={action.label}
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
          "z-10 flex shrink-0 items-center gap-2 bg-sidebar px-4 text-sidebar-foreground transition-[width,height] duration-200 ease-linear md:h-16 md:rounded-t-lg md:bg-background md:px-6 md:text-foreground group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
        )}
      >
        <Breadcrumbs />
      </header>

      <SubsectionTabs />

      <ScrollableContainer className="grow overflow-y-auto p-3 md:px-6 md:py-2">
        {children}
      </ScrollableContainer>

      {action && (
        <div className="relative h-0 w-full">
          <FAB
            key={action.label}
            icon={action.icon}
            onClick={action.onClick ?? undefined}
            className="absolute right-4 bottom-4 z-20"
            elevation="high"
          />
        </div>
      )}

      <BottomNav />
    </div>
  );
}
