import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * Test render helper that wraps the UI under test with a fresh QueryClient.
 *
 * - `retry: false` — failing queries should surface immediately in tests.
 * - `gcTime: 0` / `staleTime: 0` — no cross-test cache leakage.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions,
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient: client,
  };
}
