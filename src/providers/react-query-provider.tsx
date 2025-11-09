"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type PropsWithChildren, useEffect, useState } from "react";

function ReactQueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(new QueryClient());
  const [enableDevTools, setEnableDevTools] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnableDevTools(localStorage.getItem("query-devtools") === "true");
  }, []);

  return (
    <QueryClientProvider client={client}>
      {children}

      {enableDevTools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default ReactQueryProvider;
