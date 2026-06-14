import { useSyncExternalStore } from 'react';
import type { TextRegion } from '../../drizzle/schema';

type Project = {
  id: number;
  title: string;
  originalImageUrl: string;
  status: 'ready';
  userId: number;
};

type QueryResult<T> = {
  data: T;
  isLoading: boolean;
  refetch: () => Promise<{ data: T }>;
};

type MutationResult<TInput, TOutput> = {
  mutateAsync: (input: TInput) => Promise<TOutput>;
};

function createSampleImage(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#facc15" />
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#bg)" />
      <rect x="70" y="70" width="1460" height="860" rx="36" fill="#0b1220" stroke="#243042" stroke-width="2" />
      <rect x="110" y="110" width="510" height="780" rx="28" fill="#121a2e" stroke="#243042" />
      <rect x="690" y="150" width="780" height="92" rx="22" fill="url(#accent)" opacity="0.92" />
      <text x="740" y="210" font-family="Inter, Arial, sans-serif" font-size="56" font-weight="700" fill="#111827">Layer-based text editor</text>
      <text x="740" y="302" font-family="Inter, Arial, sans-serif" font-size="30" fill="#e5e7eb">Centralized layer state, pixel-perfect exports, and gradual migration.</text>
      <rect x="740" y="360" width="620" height="74" rx="18" fill="#1f2937" />
      <text x="770" y="408" font-family="Inter, Arial, sans-serif" font-size="28" fill="#f9fafb">Editable canvas overlay</text>
      <rect x="740" y="462" width="540" height="74" rx="18" fill="#1f2937" />
      <text x="770" y="510" font-family="Inter, Arial, sans-serif" font-size="28" fill="#f9fafb">Style controls + export preview</text>
      <rect x="160" y="170" width="410" height="52" rx="14" fill="#f59e0b" opacity="0.85" />
      <text x="190" y="205" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600" fill="#111827">Detected text region 1</text>
      <rect x="160" y="268" width="340" height="52" rx="14" fill="#fb7185" opacity="0.78" />
      <text x="190" y="303" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600" fill="#111827">Region 2</text>
      <rect x="160" y="366" width="290" height="52" rx="14" fill="#60a5fa" opacity="0.78" />
      <text x="190" y="401" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600" fill="#111827">Region 3</text>
      <rect x="160" y="600" width="380" height="140" rx="24" fill="#0f172a" stroke="#334155" />
      <text x="190" y="655" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#e5e7eb">Export compatible</text>
      <text x="190" y="703" font-family="Inter, Arial, sans-serif" font-size="22" fill="#cbd5e1">Vercel-ready Vite app</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createSampleRegions(): TextRegion[] {
  return [
    {
      id: 1,
      originalText: 'Layer-based text editor',
      editedText: 'Layer-based text editor',
      x: 61,
      y: 14,
      width: 31,
      height: 9,
      fontFamily: 'Inter',
      fontSize: 34,
      fontWeight: '700',
      fontStyle: 'normal',
      color: '#111827',
      backgroundColor: 'transparent',
      letterSpacing: 0,
      textAlign: 'left',
      confidence: 0.99,
    },
    {
      id: 2,
      originalText: 'Editable canvas overlay',
      editedText: 'Editable canvas overlay',
      x: 61,
      y: 36,
      width: 28,
      height: 7,
      fontFamily: 'Inter',
      fontSize: 26,
      fontWeight: '600',
      fontStyle: 'normal',
      color: '#f9fafb',
      backgroundColor: 'transparent',
      letterSpacing: 0,
      textAlign: 'left',
      confidence: 0.96,
    },
    {
      id: 3,
      originalText: 'Export compatible',
      editedText: 'Export compatible',
      x: 11,
      y: 60,
      width: 25,
      height: 7,
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: '700',
      fontStyle: 'normal',
      color: '#e5e7eb',
      backgroundColor: 'transparent',
      letterSpacing: 0,
      textAlign: 'left',
      confidence: 0.92,
    },
  ];
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

const mockProject: Project = {
  id: 1,
  title: 'Textify Demo',
  originalImageUrl: createSampleImage(),
  status: 'ready',
  userId: 1,
};

let mockRegions: TextRegion[] = createSampleRegions();

function cloneProject(): Project {
  return { ...mockProject };
}

function cloneRegions(): TextRegion[] {
  return mockRegions.map((region) => ({ ...region }));
}

function useProjectQuery(id: number, enabled: boolean): QueryResult<Project | undefined> {
  const data = useSyncExternalStore(
    subscribe,
    () => (enabled && mockProject.id === id ? mockProject : undefined),
    () => (enabled && mockProject.id === id ? mockProject : undefined)
  );

  return {
    data,
    isLoading: false,
    refetch: async () => {
      emit();
      return { data: enabled && mockProject.id === id ? cloneProject() : undefined };
    },
  };
}

function useRegionsQuery(projectId: number, enabled: boolean): QueryResult<TextRegion[] | undefined> {
  const data = useSyncExternalStore(
    subscribe,
    () => (enabled && mockProject.id === projectId ? mockRegions : undefined),
    () => (enabled && mockProject.id === projectId ? mockRegions : undefined)
  );

  return {
    data,
    isLoading: false,
    refetch: async () => {
      emit();
      return { data: enabled && mockProject.id === projectId ? cloneRegions() : undefined };
    },
  };
}

function useAnalyzeMutation(): MutationResult<{ projectId: number }, { regions: TextRegion[] }> {
  return {
    mutateAsync: async ({ projectId }) => {
      if (projectId === mockProject.id && mockRegions.length === 0) {
        mockRegions = createSampleRegions();
        emit();
      }

      return { regions: cloneRegions() };
    },
  };
}

function useUpdateTextRegionMutation(): MutationResult<Partial<TextRegion> & { id: number }, TextRegion> {
  return {
    mutateAsync: async (payload) => {
      mockRegions = mockRegions.map((region) =>
        region.id === payload.id ? ({ ...region, ...payload } as TextRegion) : region
      );
      emit();
      const updated = mockRegions.find((region) => region.id === payload.id);
      if (!updated) {
        throw new Error('Region not found');
      }
      return { ...updated };
    },
  };
}

export const trpc = {
  editor: {
    getProject: {
      useQuery: ({ id }: { id: number }, options: { enabled?: boolean } = {}) =>
        useProjectQuery(id, options.enabled ?? true),
    },
    getTextRegions: {
      useQuery: ({ projectId }: { projectId: number }, options: { enabled?: boolean } = {}) =>
        useRegionsQuery(projectId, options.enabled ?? true),
    },
    analyzeImage: {
      useMutation: () => useAnalyzeMutation(),
    },
    updateTextRegion: {
      useMutation: () => useUpdateTextRegionMutation(),
    },
  },
};
