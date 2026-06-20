import { create } from 'zustand';
import { useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { loadGoogleFont } from '@/components/FontLoader';
import { CanvasRegion, EditorState, EditorActions, EditorStore } from '../types';
import type { TextRegion } from "../../../drizzle/schema";

const initialState: EditorState = {
  projectId: undefined,
  imgSize: { w: 0, h: 0 },
  imgLoaded: false,
  showOverlays: true,
  regions: [],
  selectedId: null,
  isAnalyzing: false,
  analysisComplete: false,
  isExporting: false,
  project: null,
  rawRegions: undefined,
  user: null,
  isAuthenticated: false,
  authLoading: true,
  containerRef: { current: null },
};

function normalizeText(text: string): string {
  return text.normalize("NFC");
}

export const useEditorStore = create<EditorStore>()((set, get) => ({
  ...initialState,

  // Actions
  setProjectId: (projectId) => set({ projectId }),
  setImgSize: (imgSize) => set({ imgSize }),
  setImgLoaded: (imgLoaded) => set({ imgLoaded }),
  setShowOverlays: (showOverlays) => set({ showOverlays }),
  setRegions: (regions) => set({ regions }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisComplete: (analysisComplete) => set({ analysisComplete }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setProject: (project) => set({ project }),
  setRawRegions: (rawRegions) => set({ rawRegions }),
  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  setNavigate: (navigate) => set({ navigate }),
  setRefetchRegions: (refetchRegions) => set({ refetchRegions }),
  setRefetchProject: (refetchProject) => set({ refetchProject }),
  setContainerRef: (containerRef) => set({ containerRef }),
  setAnalyzeImageMutation: (analyzeImageMutation) => set({ analyzeImageMutation }),
  setUpdateRegionMutation: (updateRegionMutation) => set({ updateRegionMutation }),

  // Helper for computing pixel coordinates
  computeRegions: (raw: TextRegion[], w: number, h: number): CanvasRegion[] =>
    raw.map((r) => ({
      ...r,
      px: (Number(r.x) / 100) * w,
      py: (Number(r.y) / 100) * h,
      pw: (Number(r.width) / 100) * w,
      ph: (Number(r.height) / 100) * h,
    })),

  // Handlers
  handleImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    get().setImgSize({ w: img.clientWidth, h: img.clientHeight });
    get().setImgLoaded(true);
  },

  handleAnalyze: async () => {
    const { projectId, project, user, setIsAnalyzing, setSelectedId, refetchRegions, refetchProject, setAnalysisComplete, analyzeImageMutation } = get();
    if (!projectId || !analyzeImageMutation) return;

    if (project && user && project.userId !== user.id) {
      toast.error("You do not have permission to modify this project");
      return;
    }

    setIsAnalyzing(true);
    setSelectedId(null);
    try {
      const result = await analyzeImageMutation.mutateAsync({ projectId });
      await refetchRegions();
      await refetchProject();
      setAnalysisComplete(true);
      if (result.regions.length === 0) {
        toast.info("No text detected in this image.");
      } else {
        toast.success(`Detected ${result.regions.length} text region${result.regions.length > 1 ? "s" : ""}.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  },

  handleRegionUpdate: async (id: number, field: string, value: string | number) => {
    const { project, user, setRegions, refetchRegions, updateRegionMutation } = get();
    if (!updateRegionMutation) return;

    if (project && user && project.userId !== user.id) {
      toast.error("Permission denied");
      return;
    }

    const finalValue = typeof value === "string" ? normalizeText(value) : value;

    setRegions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: finalValue } : r))
    );
    try {
      await updateRegionMutation.mutateAsync({ id, [field]: finalValue } as any);
    } catch {
      toast.error("Failed to save change");
      refetchRegions();
    }
  },

  handleExport: async (format: "png" | "jpg") => {
    const { project, imgSize, regions, setIsExporting } = get();
    if (!project || !imgSize.w || !imgSize.h) return;
    setIsExporting(true);

    try {
      const canvas = document.createElement("canvas");
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = project.originalImageUrl;
      });

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const scaleX = img.naturalWidth / imgSize.w;
      const scaleY = img.naturalHeight / imgSize.h;

      const fontPromises = regions.map(r => {
        if (!r.fontFamily) return Promise.resolve();
        const weight = r.fontWeight ?? "400";
        const style = r.fontStyle ?? "normal";
        return document.fonts.load(`${style} ${weight} 16px "${r.fontFamily}"`);
      });
      await Promise.all(fontPromises);

      for (const region of regions) {
        const text = normalizeText(region.editedText ?? region.originalText ?? "");
        if (!text) continue;

        const x = (Number(region.x) / 100) * canvas.width;
        const y = (Number(region.y) / 100) * canvas.height;
        const w = (Number(region.width) / 100) * canvas.width;
        const h = (Number(region.height) / 100) * canvas.height;
        const fontSize = (region.fontSize ?? 16) * Math.min(scaleX, scaleY);

        if (region.backgroundColor && region.backgroundColor !== "transparent") {
          ctx.fillStyle = region.backgroundColor;
          ctx.fillRect(x, y, w, h);
        }

        const weight = region.fontWeight ?? "400";
        const style = region.fontStyle ?? "normal";
        const family = region.fontFamily ?? "sans-serif";
        ctx.font = `${style} ${weight} ${fontSize}px "${family}", sans-serif`;
        ctx.fillStyle = region.color ?? "#000000";
        ctx.textAlign = (region.textAlign as CanvasTextAlign) ?? "left";
        ctx.textBaseline = "top";

        if ("letterSpacing" in ctx) {
          (ctx as any).letterSpacing = `${(region.letterSpacing ?? 0) * Math.min(scaleX, scaleY)}px`;
        }

        const alignX =
          region.textAlign === "center" ? x + w / 2 :
          region.textAlign === "right" ? x + w :
          x;

        ctx.fillText(text, alignX, y + h * 0.1, w);
      }

      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const quality = format === "jpg" ? 0.95 : undefined;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${project.title || "edited"}.${format}`;
      a.click();

      toast.success(`Image exported as ${format.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  },

  normalizeText,
}));

// Selector for selected region
export const useSelectedRegion = () =>
  useEditorStore((state) => state.regions.find((r) => r.id === state.selectedId) ?? null);

// Initialize the store with data from hooks that cannot be called inside the store definition
export function useEditorInitializer() {
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId ? parseInt(params.projectId) : undefined;
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);

  const { data: project, isLoading: projectLoading, refetch: refetchProject } =
    trpc.editor.getProject.useQuery(
      { id: projectId ?? 0 },
      { enabled: !!projectId && isAuthenticated }
    );

  const { data: rawRegions, refetch: refetchRegions } =
    trpc.editor.getTextRegions.useQuery(
      { projectId: projectId ?? 0 },
      { enabled: !!projectId && isAuthenticated }
    );

  const analyzeImageMutation = trpc.editor.analyzeImage.useMutation();
  const updateRegionMutation = trpc.editor.updateTextRegion.useMutation();

  const setStore = useEditorStore();

  useEffect(() => {
    setStore.setProjectId(projectId);
    setStore.setNavigate(navigate);
    setStore.setUser(user);
    setStore.setIsAuthenticated(isAuthenticated);
    setStore.setAuthLoading(authLoading);
    setStore.setProject(project);
    setStore.setRawRegions(rawRegions);
    setStore.setRefetchProject(refetchProject);
    setStore.setRefetchRegions(refetchRegions);
    setStore.setContainerRef(containerRef);
    setStore.setAnalyzeImageMutation(analyzeImageMutation);
    setStore.setUpdateRegionMutation(updateRegionMutation);
  }, [projectId, navigate, user, isAuthenticated, authLoading, project, rawRegions, refetchProject, refetchRegions, containerRef, setStore, analyzeImageMutation, updateRegionMutation]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // Compute pixel coords and load fonts
  useEffect(() => {
    const { imgSize, computeRegions, setRegions, setAnalysisComplete, rawRegions: storeRawRegions } = setStore;
    if (storeRawRegions && imgSize.w > 0) {
      const computed = computeRegions(storeRawRegions, imgSize.w, imgSize.h);
      setRegions(computed);
      setAnalysisComplete(computed.length > 0);
      computed.forEach((r) => {
        if (r.fontFamily) {
          loadGoogleFont(r.fontFamily, r.fontWeight ?? "400", r.fontStyle ?? "normal");
        }
      });
    }
  }, [setStore.rawRegions, setStore.imgSize.w, setStore.computeRegions, setStore.setRegions, setStore.setAnalysisComplete]);

  return { projectLoading, project, authLoading, containerRef };
}
