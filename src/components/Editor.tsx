import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
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

type UpdatableRegionField =
  | "editedText"
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "fontStyle"
  | "color"
  | "backgroundColor"
  | "letterSpacing"
  | "textAlign";

type RegionMutationPayload = {
  id: number;
  editedText?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string | null;
  letterSpacing?: number;
  textAlign?: string;
};

function isUpdatableRegionField(field: string): field is UpdatableRegionField {
  return [
    "editedText",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "color",
    "backgroundColor",
    "letterSpacing",
    "textAlign",
  ].includes(field);
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
    initializeFromRegions(rawRegions);
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
    async (id: number, field: UpdatableRegionField, value: string | number | null) => {
      try {
        let payload: RegionMutationPayload;
        switch (field) {
          case "editedText":
            payload = { id, editedText: typeof value === "string" ? value : "" };
            break;
          case "fontFamily":
            payload = { id, fontFamily: typeof value === "string" ? value : "" };
            break;
          case "fontSize":
            payload = { id, fontSize: typeof value === "number" ? value : 16 };
            break;
          case "fontWeight":
            payload = { id, fontWeight: typeof value === "string" ? value : "400" };
            break;
          case "fontStyle":
            payload = { id, fontStyle: typeof value === "string" ? value : "normal" };
            break;
          case "color":
            payload = { id, color: typeof value === "string" ? value : "#000000" };
            break;
          case "backgroundColor":
            payload = { id, backgroundColor: value === null ? null : typeof value === "string" ? value : null };
            break;
          case "letterSpacing":
            payload = { id, letterSpacing: typeof value === "number" ? value : 0 };
            break;
          case "textAlign":
            payload = { id, textAlign: typeof value === "string" ? value : "left" };
            break;
          default:
            payload = { id };
        }
        await updateRegion.mutateAsync(payload);
      } catch (error) {
        console.error("Failed to persist layer update", error);
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
        if (!isUpdatableRegionField(field)) return;
        if (value === undefined) {
          void updateRegionField(id, field, null);
          return;
        }
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
          const editedText = typeof region.editedText === "string" ? region.editedText : "";
          const originalText = typeof region.originalText === "string" ? region.originalText : "";
          const text = normalizeText(editedText || originalText);
          if (!text) continue;

          const xPct = typeof region.x === "number" ? region.x : 0;
          const yPct = typeof region.y === "number" ? region.y : 0;
          const wPct = typeof region.width === "number" ? region.width : 0;
          const hPct = typeof region.height === "number" ? region.height : 0;
          const fontSizeValue = typeof region.fontSize === "number" ? region.fontSize : 16;

          const x = (xPct / 100) * canvas.width;
          const y = (yPct / 100) * canvas.height;
          const w = (wPct / 100) * canvas.width;
          const h = (hPct / 100) * canvas.height;
          const fontSize = fontSizeValue * Math.min(scaleX, scaleY);

          if (region.backgroundColor && region.backgroundColor !== "transparent") {
            ctx.fillStyle = region.backgroundColor;
            ctx.fillRect(x, y, w, h);
          }

          const weight = typeof region.fontWeight === "string" ? region.fontWeight : "400";
          const style = typeof region.fontStyle === "string" ? region.fontStyle : "normal";
          const family = typeof region.fontFamily === "string" ? region.fontFamily : "sans-serif";
          ctx.font = `${style} ${weight} ${fontSize}px "${family}", sans-serif`;
          ctx.fillStyle = typeof region.color === "string" ? region.color : "#000000";
          const textAlign = region.textAlign === "center" || region.textAlign === "right" ? region.textAlign : "left";
          ctx.textAlign = textAlign;
          ctx.textBaseline = "top";

          const alignX =
            textAlign === "center" ? x + w / 2 : textAlign === "right" ? x + w : x;

          ctx.fillText(text, alignX, y + h * 0.1, w);
        }

        const mimeType = format === "png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, format === "jpg" ? 0.95 : undefined);
        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = `${project.title || "edited"}.${format}`;
        anchor.click();

        toast.success(`Image exported as ${format.toUpperCase()}`);
      } catch (error) {
        console.error("Export failed", error);
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
