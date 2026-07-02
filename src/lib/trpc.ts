/**
 * TEMPORARY FRONTEND MOCK — NOT FOR PRODUCTION USE
 *
 * This module provides a lightweight mock of the tRPC client to support
 * frontend development and preview environments before the backend is
 * available. It returns static/empty data and does not make any real
 * network requests.
 *
 * Migration: Once the backend is available, replace this file with a real
 * tRPC client created via `createTRPCClient` (or the React Query integration
 * via `createTRPCReact`) pointing at the production API endpoint.
 */

// Mock router type
export type AppRouter = any;

// Mock TRPC client with hook-compatible API
export const trpc = {
  editor: {
    getProject: {
      useQuery: (_args?: any, _opts?: any) => ({
        data: null as any,
        isLoading: false,
        refetch: async () => {},
      }),
    },
    getTextRegions: {
      useQuery: (_args?: any, _opts?: any) => ({
        data: [] as any[],
        isLoading: false,
        refetch: async () => {},
      }),
    },
    analyzeImage: {
      useMutation: () => ({
        mutateAsync: async (_args?: any) => ({ regions: [] as any[] }),
      }),
    },
    updateTextRegion: {
      useMutation: () => ({
        mutateAsync: async (_args?: any) => ({} as any),
      }),
    },
  },
};
