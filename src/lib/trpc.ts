type AnyFn = (...args: any[]) => any;

/**
 * TEMPORARY FRONTEND MOCK — NOT FOR PRODUCTION USE
 *
 * Replace with real tRPC client when backend is ready.
 */

export type AppRouter = unknown;

const createQuery = <TData>(data: TData) => ({
  data,
  isLoading: false,
  refetch: async () => {},
});

const createMutation = <TArgs = any, TResult = any>(
  result: TResult
) => ({
  mutateAsync: async (_args?: TArgs): Promise<TResult> => result,
});

export const trpc = {
  editor: {
    getProject: {
      useQuery: (_args?: any, _opts?: any) =>
        createQuery(null as unknown),
    },

    getTextRegions: {
      useQuery: (_args?: any, _opts?: any) =>
        createQuery([] as any[]),
    },

    analyzeImage: {
      useMutation: () =>
        createMutation<any, { regions: any[] }>({
          regions: [],
        }),
    },

    updateTextRegion: {
      useMutation: () =>
        createMutation<any, Record<string, never>>({}),
    },
  },
};