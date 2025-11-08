"use client";

import { useEffect } from "react";
import { type Flags, useFlags } from "@/app/_state/flags-state";

export default function FlagsProvider({ flags }: { flags: Flags }) {
  const { setFlags } = useFlags();

  useEffect(() => {
    setFlags(flags);
  }, [setFlags, flags]);

  return null;
}
