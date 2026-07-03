export type AppRouter = unknown;

const createQuery = <TData>(data: TData) => ({
  data,
  isLoading: false,
  refetch: async () => {},
});

const createMutation = <TArgs = unknown, TResult = unknown>(
  result: TResult
) => ({
  mutateAsync: async (_args?: TArgs): Promise<TResult> => result,
});

export const trpc = {
  editor: {
    getProject: {
      useQuery: () => createQuery<null>(null),
    },

    getTextRegions: {
      useQuery: () => createQuery<any[]>([]),
    },

    analyzeImage: {
      useMutation: () =>
        createMutation<any, { regions: unknown[] }>({
          regions: [],
        }),
    },

    updateTextRegion: {
      useMutation: () =>
        createMutation<any, Record<string, never>>({}),
    },
  },
};