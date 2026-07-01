// Mock AppRouter type until backend router is implemented
export type AppRouter = any;

export const trpc = {
  editor: {
    getProject: {
      useQuery: (_input?: any, _opts?: any) => ({
        data: null as any,
        isLoading: true,
        refetch: async () => {},
      }),
    },
    getTextRegions: {
      useQuery: (_input?: any, _opts?: any) => ({
        data: [] as any[],
        isLoading: true,
        refetch: async () => {},
      }),
    },
    analyzeImage: {
      useMutation: () => ({
        mutateAsync: async (_input?: any) => ({ regions: [] as any[] }),
      }),
    },
    updateTextRegion: {
      useMutation: () => ({
        mutateAsync: async (_input?: any) => ({} as any),
      }),
    },
  },
};

// Helper for using TRPC hooks
export function useTRPC() {
  return trpc;
}
