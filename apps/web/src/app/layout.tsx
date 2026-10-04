import type { ReactNode } from "react";

// The locale layout and root 404 each provide their own HTML document.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
