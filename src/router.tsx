import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { PageLoader } from "@/components/PageLoader";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: 2,
        retryDelay: (n) => Math.min(1000 * 2 ** n, 8000),
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    defaultPendingMs: 300,
    defaultPendingComponent: () => <PageLoader />,
  });

  return router;
};
