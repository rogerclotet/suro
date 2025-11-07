"use client";

import { useState } from "react";
import { useAction } from "@/app/_state/action-state";
import { FAB } from "@/components/ui/fab";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import BottomNav from "./bottom-nav";
import Breadcrumbs from "./breadcrumbs";
import { ScrollableContainer, type ScrollState } from "./scrollable-container";

export default function SidebarInsetContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isMobile } = useSidebar();
  const [scrollState, setScrollState] = useState<ScrollState>({
    isAtTop: true,
    isAtBottom: false,
  });
  const { action } = useAction();

  return (
    <div className="flex h-full flex-col">
      <header
        className={cn(
          "z-10 flex h-16 shrink-0 items-center gap-2 bg-sidebar px-6 text-sidebar-foreground transition-[width,height,box-shadow] duration-200 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:rounded-t-lg md:bg-background md:text-foreground",
          isMobile &&
            !scrollState.isAtTop &&
            "shadow-[0_0_1rem_1rem_rgba(0,0,0,0.4)]",
        )}
      >
        <Breadcrumbs />
      </header>

      <ScrollableContainer
        onScrollStateChange={setScrollState}
        className="grow overflow-y-auto px-2 py-3 md:px-4 md:py-4"
      >
        {children}
      </ScrollableContainer>

      {/* TODO: add a condition to only show the FAB on mobile when the sidebar actions are in place */}
      {action && (
        <div className="relative h-0 w-full">
          <FAB key={action.label} icon={action.icon} onClick={action.onClick} />
        </div>
      )}

      <BottomNav
        className={cn(
          "z-10 transition-shadow duration-200 ease-linear",
          isMobile &&
            !scrollState.isAtBottom &&
            "shadow-[0_0_1rem_1rem_rgba(0,0,0,0.4)]",
        )}
      />
    </div>
  );
}
