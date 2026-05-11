"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useAction } from "@/app/_state/action-state";
import { FAB } from "@/components/ui/fab";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { SyncIndicator } from "@/components/ui/sync-indicator";
import BottomNav from "./bottom-nav";
import Breadcrumbs from "./breadcrumbs";
import { ScrollableContainer } from "./scrollable-container";
import SubsectionTabs from "./subsection-tabs";

export default function SidebarInsetContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { action } = useAction();

  const fabWrapperRef = useRef<HTMLDivElement>(null);
  const [fabHeight, setFabHeight] = useState(0);

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

  const fabClearance = action ? fabHeight + 24 : 0;

  return (
    <div className="flex h-full flex-col">
      <header
        className="z-10 flex min-h-[52px] shrink-0 items-center gap-2 bg-sidebar px-4 pb-2.5 text-sidebar-foreground transition-[width,height] duration-200 ease-linear md:h-16 md:rounded-t-lg md:bg-background md:px-6 md:pb-0 md:text-foreground group-has-data-[collapsible=icon]/sidebar-wrapper:md:h-12"
        style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
      >
        <Breadcrumbs />
        <div className="ml-auto hidden items-center md:flex">
          <SyncIndicator />
          <OfflineIndicator />
        </div>
      </header>

      <SubsectionTabs />

      <div className="relative grow overflow-hidden">
        <ScrollableContainer
          className="h-full overflow-y-auto px-3 py-3 md:px-6 md:py-2"
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
