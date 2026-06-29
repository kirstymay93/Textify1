import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './router';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3000}`;
};

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      async fetch(url, options) {
        const response = await fetch(url, {
          ...options,
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`TRPC Error: ${response.status}`);
        }
        return response;
      },
    }),
  ],
});

// Mock router type for now
export type AppRouter = any;

// Helper for using TRPC hooks
export function useTRPC() {
  return {
    editor: {
      getProject: {
        useQuery: () => ({
          data: null,
          isLoading: true,
          refetch: async () => {},
        }),
      },
      getTextRegions: {
        useQuery: () => ({
          data: [],
          isLoading: true,
          refetch: async () => {},
        }),
      },
      analyzeImage: {
        useMutation: () => ({
          mutateAsync: async () => ({ regions: [] }),
        }),
      },
      updateTextRegion: {
        useMutation: () => ({
          mutateAsync: async () => ({}),
        }),
      },
    },
  };
}
