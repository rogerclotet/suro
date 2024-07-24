"use client";

/**
 * Hack to work around next.js hydration
 * @see https://github.com/uidotdev/usehooks/issues/218
 */
import { useIsClient } from "@uidotdev/usehooks";
import React from "react";

type ClientOnlyProps = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export const ClientOnly: React.FC<ClientOnlyProps> = ({
  children,
  fallback,
}) => {
  const isClient = useIsClient();

  // Render children if on client side, otherwise return null
  return isClient ? <>{children}</> : (fallback ?? null);
};
