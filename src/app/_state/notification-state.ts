"use client";

import type {} from "@redux-devtools/extension";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface NotificationState {
  unreadCounts: Record<string, number>;
  totalUnread: number;
  setUnreadCounts: (counts: Record<string, number>, total: number) => void;
  decrementSection: (section: string) => void;
  decrementTotal: () => void;
  clearAll: () => void;
}

const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      unreadCounts: {},
      totalUnread: 0,
      setUnreadCounts: (counts, total) =>
        set({ unreadCounts: counts, totalUnread: total }),
      decrementSection: (section) => {
        const counts = { ...get().unreadCounts };
        const current = counts[section] ?? 0;
        if (current > 0) {
          counts[section] = current - 1;
          set({
            unreadCounts: counts,
            totalUnread: Math.max(0, get().totalUnread - 1),
          });
        }
      },
      decrementTotal: () => {
        set({ totalUnread: Math.max(0, get().totalUnread - 1) });
      },
      clearAll: () => set({ unreadCounts: {}, totalUnread: 0 }),
    }),
    { name: "NotificationStore" },
  ),
);

export function useNotifications() {
  const unreadCounts = useNotificationStore((s) => s.unreadCounts);
  const totalUnread = useNotificationStore((s) => s.totalUnread);
  const setUnreadCounts = useNotificationStore((s) => s.setUnreadCounts);
  const decrementSection = useNotificationStore((s) => s.decrementSection);
  const decrementTotal = useNotificationStore((s) => s.decrementTotal);
  const clearAll = useNotificationStore((s) => s.clearAll);

  function unreadForSection(section: string): number {
    return unreadCounts[section] ?? 0;
  }

  function hasUnreadInSections(sections: string[]): boolean {
    return sections.some((s) => (unreadCounts[s] ?? 0) > 0);
  }

  return {
    unreadCounts,
    totalUnread,
    setUnreadCounts,
    decrementSection,
    decrementTotal,
    clearAll,
    unreadForSection,
    hasUnreadInSections,
  };
}
