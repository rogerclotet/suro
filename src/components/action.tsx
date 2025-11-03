"use client";

import { useEffect } from "react";
import { useAction } from "@/app/_state/action-state";

export default function Action({
  label,
  icon,
  pathParts,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  pathParts?: string[];
  onClick: () => void;
}) {
  const { setAction } = useAction();

  useEffect(() => {
    setAction({ label, icon, pathParts, onClick });

    return () => {
      setAction(null);
    };
  }, [label, icon, pathParts, onClick, setAction]);

  return null;
}
