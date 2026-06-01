import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

/**
 * Global React Query client.
 *
 * Defaults are conservative to avoid surprising network traffic:
 *  - `refetchOnWindowFocus: false` — don't re-hit the API just because the
 *    user tabbed back to the browser.
 *  - `retry: 1` — try failed queries once before showing an error.
 *  - Per-query `staleTime` lives in the feature hooks, where it belongs.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
