import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import type { TextRegion } from "../../../drizzle/schema";
import { trpc } from "@/lib/trpc";
import { loadGoogleFont } from "@/components/FontLoader";
import { useLayerState } from "@/hooks/useLayerState";
import { layerToRegion, type TextStyling } from "@/lib/layerSystem";
import { useLayerRenderer } from "@/hooks/useLayerRenderer";
import { LayerSidebar } from "@/components/LayerSidebar";
import { LayerPropertiesPanel } from "@/components/LayerPropertiesPanel";

function normalizeText(text: string): string {
  return text.normalize("NFC");
}

export default function Editor() {
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId ? Number(params.projectId) : 0;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const overlayContainerRef = useRef<HTMLDivElement>(null);

  const { data: project } = trpc.editor.getProject.useQuery(
    { id: projectId },
    { enabled: !!projectId }
  );

  const { data: rawRegions = [], refetch: refetchRegions } = trpc.editor.getTextRegions.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const updateRegion = trpc.editor.updateTextRegion.useMutation();

  const layerState = useLayerState({
    initialRegions: [],
    containerWidth: imgSize.w,
    containerHeight: imgSize.h,
  });

  const {
    layers,
    selectedLayerId,
    selectedLayer,
    initializeFromRegions,
    updateContainerSize,
    deselectLayer,
    selectLayer,
    updateLayerTextContent,
    updateLayerStyle,
    getLayer,
  } = layerState;

  useEffect(() => {
    if (!imgSize.w || !imgSize.h) return;
    initializeFromRegions(rawRegions as (TextRegion & { px?: number; py?: number; pw?: number; ph?: number })[]);
  }, [imgSize.w, imgSize.h, rawRegions, initializeFromRegions]);

  useEffect(() => {
    layers.forEach((layer) => {
      if (layer.styling.fontFamily) {
        loadGoogleFont(layer.styling.fontFamily, layer.styling.fontWeight, layer.styling.fontStyle);
      }
    });
  }, [layers]);

  const metrics = useLayerRenderer({
    containerRef: overlayContainerRef,
    layers,
    selectedLayerId,
    onSelectLayer: (layerId) => {
      if (layerId == null) {
        deselectLayer();
        return;
      }
      selectLayer(layerId);
    },
    enabled: imgLoaded && showLayers,
  });

  const updateRegionField = useCallback(
    async (id: number, field: string, value: string | number | null) => {
      try {
        await updateRegion.mutateAsync({ id, [field]: value } as Record<string, unknown>);
      } catch {
        toast.error("Failed to save changes");
        refetchRegions();
      }
    },
    [updateRegion, refetchRegions]
  );

  const handleUpdateText = useCallback(
    (id: number, text: string) => {
      const normalized = normalizeText(text);
      updateLayerTextContent(id, normalized);
      void updateRegionField(id, "editedText", normalized);
    },
    [updateLayerTextContent, updateRegionField]
  );

  const handleUpdateStyle = useCallback(
    (id: number, updates: Partial<TextStyling>) => {
      updateLayerStyle(id, updates);
      Object.entries(updates).forEach(([field, value]) => {
        void updateRegionField(id, field, value as string | number | null);
      });
    },
    [updateLayerStyle, updateRegionField]
  );

  const handleReset = useCallback(
    (id: number) => {
      const layer = getLayer(id);
      if (!layer) return;
      const resetText = normalizeText(layer.originalText ?? "");
      updateLayerTextContent(id, resetText);
      void updateRegionField(id, "editedText", resetText);
    },
    [getLayer, updateLayerTextContent, updateRegionField]
  );

  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImgLoaded(true);
    setImgSize({ w: img.clientWidth, h: img.clientHeight });
  }, []);

  useEffect(() => {
    if (!imageContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      const image = imageContainerRef.current?.querySelector("img");
      if (!image) return;
      const width = image.clientWidth;
      const height = image.clientHeight;
      setImgSize({ w: width, h: height });
      updateContainerSize(width, height);
    });

    observer.observe(imageContainerRef.current);
    return () => observer.disconnect();
  }, [updateContainerSize]);

  const handleExport = useCallback(
    async (format: "png" | "jpg") => {
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
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");

        ctx.drawImage(img, 0, 0);

        const scaleX = img.naturalWidth / imgSize.w;
        const scaleY = img.naturalHeight / imgSize.h;
        const exportRegions = layers.map(layerToRegion);

        for (const region of exportRegions) {
          const text = normalizeText((region.editedText as string) ?? (region.originalText as string) ?? "");
          if (!text) continue;

          const x = ((region.x as number) / 100) * canvas.width;
          const y = ((region.y as number) / 100) * canvas.height;
          const w = ((region.width as number) / 100) * canvas.width;
          const h = ((region.height as number) / 100) * canvas.height;
          const fontSize = ((region.fontSize as number) ?? 16) * Math.min(scaleX, scaleY);

          if (region.backgroundColor && region.backgroundColor !== "transparent") {
            ctx.fillStyle = region.backgroundColor as string;
            ctx.fillRect(x, y, w, h);
          }

          const weight = (region.fontWeight as string) ?? "400";
          const style = (region.fontStyle as string) ?? "normal";
          const family = (region.fontFamily as string) ?? "sans-serif";
          ctx.font = `${style} ${weight} ${fontSize}px "${family}", sans-serif`;
          ctx.fillStyle = (region.color as string) ?? "#000000";
          ctx.textAlign = ((region.textAlign as CanvasTextAlign) ?? "left");
          ctx.textBaseline = "top";

          const alignX =
            region.textAlign === "center" ? x + w / 2 : region.textAlign === "right" ? x + w : x;

          ctx.fillText(text, alignX, y + h * 0.1, w);
        }

        const mimeType = format === "png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, format === "jpg" ? 0.95 : undefined);
        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = `${project.title || "edited"}.${format}`;
        anchor.click();

        toast.success(`Image exported as ${format.toUpperCase()}`);
      } catch {
        toast.error("Export failed");
      } finally {
        setIsExporting(false);
      }
    },
    [project, imgSize, layers]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="w-72 shrink-0">
        <LayerSidebar
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={selectLayer}
          onToggleVisibility={layerState.updateLayerVisibility}
          onToggleLock={layerState.updateLayerLock}
          onMoveLayerUp={layerState.moveLayerUp}
          onMoveLayerDown={layerState.moveLayerDown}
          onDeleteLayer={layerState.removeLayer}
        />
      </div>

      <main className="relative flex-1 overflow-auto bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-border/60 px-2 py-1 text-xs"
            onClick={() => setShowLayers((value) => !value)}
          >
            {showLayers ? "Hide" : "Show"} Layers
          </button>
          <button
            type="button"
            className="rounded border border-border/60 px-2 py-1 text-xs"
            onClick={() => handleExport("png")}
            disabled={isExporting || !imgLoaded}
          >
            Export PNG
          </button>
          <button
            type="button"
            className="rounded border border-border/60 px-2 py-1 text-xs"
            onClick={() => handleExport("jpg")}
            disabled={isExporting || !imgLoaded}
          >
            Export JPG
          </button>
          <span className="text-xs text-muted-foreground">
            {metrics.layerCount} layers • {metrics.estimatedFps}fps
          </span>
        </div>

        <div ref={imageContainerRef} className="relative inline-block" onClick={() => deselectLayer()}>
          {project?.originalImageUrl ? (
            <img
              src={project.originalImageUrl}
              alt={project.title ?? "Project image"}
              className="block max-w-full rounded-md"
              onLoad={handleImageLoad}
              crossOrigin="anonymous"
              draggable={false}
            />
          ) : (
            <div className="flex h-64 w-96 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              No image loaded
            </div>
          )}
          <div ref={overlayContainerRef} className="absolute inset-0" />
        </div>
      </main>

      <div className="w-80 shrink-0">
        <LayerPropertiesPanel
          layer={selectedLayer}
          onUpdateText={handleUpdateText}
          onUpdateStyle={handleUpdateStyle}
          onResetToOriginal={handleReset}
        />
      </div>
    </div>
  );
}
