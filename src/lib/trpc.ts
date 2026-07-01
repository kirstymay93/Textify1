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
