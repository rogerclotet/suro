"use client";

import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { useAction } from "@/app/_state/action-state";

export default function Action({
  label,
  icon,
  pathParts,
  onClick,
  disabled,
}: {
  label: string;
  icon: LucideIcon;
  pathParts?: string[];
  onClick?: () => void;
  disabled?: boolean;
}) {
  const { setAction } = useAction();

  useEffect(() => {
    setAction({ label, icon, pathParts, onClick, disabled });

    return () => {
      setAction(null);
    };
  }, [label, icon, pathParts, onClick, disabled, setAction]);

  return null;
}
