"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNotifications } from "@/app/_state/notification-state";
import { useProjects } from "@/app/_state/project-state";

export default function NotificationProvider() {
  const { project } = useProjects();
  const { setUnreadCounts } = useNotifications();

  const { data } = useQuery<{
    counts: Record<string, number>;
    total: number;
  }>({
    queryKey: ["notification-unread-counts", project?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (project?.id) {
        params.set("projectId", project.id);
      }
      const res = await fetch(`/api/notifications/unread-counts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch unread counts");
      return res.json();
    },
    refetchInterval: 30_000,
    enabled: true,
  });

  useEffect(() => {
    if (data) {
      setUnreadCounts(data.counts, data.total);
    }
  }, [data, setUnreadCounts]);

  return null;
}
