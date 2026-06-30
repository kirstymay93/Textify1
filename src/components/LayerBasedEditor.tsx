import { Component, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Bold,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileImage,
  FileType,
  Italic,
  Loader2,
  RefreshCw,
  Sparkles,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLayerState } from "@/hooks/useLayerState";
import {
  getLayerDisplayText,
  isLayerModified,
  type Layer,
  type TextStyling,
} from "@/lib/layerSystem";

const STYLE_FIELDS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "color",
  "backgroundColor",
  "letterSpacing",
  "lineHeight",
  "textAlign",
] as const;

type EditableStyleField = (typeof STYLE_FIELDS)[number];
type EditableField = "editedText" | EditableStyleField;

function normalizeText(text: string): string {
  return text.normalize("NFC");
}

function isStyleField(field: string): field is EditableStyleField {
  return (STYLE_FIELDS as readonly string[]).includes(field);
}

function ensureFontLoaded(family: string, weight: string, style: string): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document) || !family) return Promise.resolve();
  return document.fonts.load(`${style} ${weight} 16px "${family}"`).then(() => undefined).catch(() => undefined);
}

class LocalEditorErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
          <div>
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="font-medium text-foreground">The editor hit an unexpected error.</p>
            <p className="text-sm text-muted-foreground mt-2">Refresh the page to try again.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function getDraftFromLayer(layer: Layer) {
  return {
    editedText: getLayerDisplayText(layer),
    fontFamily: layer.styling.fontFamily ?? "sans-serif",
    fontSize: layer.styling.fontSize ?? 16,
    fontWeight: layer.styling.fontWeight ?? "400",
    fontStyle: layer.styling.fontStyle ?? "normal",
    color: layer.styling.color ?? "#ffffff",
    backgroundColor: layer.styling.backgroundColor ?? "transparent",
    letterSpacing: layer.styling.letterSpacing ?? 0,
    textAlign: layer.styling.textAlign ?? "left",
  };
}

function LayerEditor({
  layer,
  onUpdate,
  onClose,
}: {
  layer: Layer;
  onUpdate: (field: EditableField, value: string | number) => void | Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => getDraftFromLayer(layer));

  useEffect(() => {
    setDraft(getDraftFromLayer(layer));
  }, [layer.id]);

  const commit = (field: EditableField, value: string | number) => {
    onUpdate(field, value);
  };

  const fontWeights = ["100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs font-semibold text-foreground">Edit Layer</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {layer.styling.fontFamily ?? "Unknown"} · {Math.round((layer.confidence ?? 0) * 100)}% confidence
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          aria-label="Close layer editor"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Original Text
          </label>
          <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground font-mono break-words">
            {layer.originalText}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Text
          </label>
          <textarea
            value={draft.editedText}
            onChange={(e) => setDraft((current) => ({ ...current, editedText: e.target.value }))}
            onBlur={() => commit("editedText", draft.editedText)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-input border border-border/60 text-sm text-foreground resize-none focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
            style={{
              fontFamily: `"${draft.fontFamily}", sans-serif`,
              fontWeight: draft.fontWeight,
              fontStyle: draft.fontStyle,
              color: draft.color,
              backgroundColor: draft.backgroundColor === "transparent" ? "transparent" : draft.backgroundColor,
              letterSpacing: `${draft.letterSpacing}px`,
              textAlign: draft.textAlign,
            }}
            placeholder="Enter replacement text…"
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Font Family
          </label>
          <input
            value={draft.fontFamily}
            onChange={(e) => setDraft((current) => ({ ...current, fontFamily: e.target.value }))}
            onBlur={() => commit("fontFamily", draft.fontFamily || "sans-serif")}
            className="w-full h-9 px-3 rounded-lg bg-input border border-border/60 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
            placeholder="sans-serif"
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
            Font Size
            <span className="text-primary font-mono">{Math.round(draft.fontSize)}px</span>
          </label>
          <input
            type="range"
            min={6}
            max={200}
            step={1}
            value={draft.fontSize}
            onChange={(e) => setDraft((current) => ({ ...current, fontSize: Number(e.target.value) }))}
            onMouseUp={() => commit("fontSize", draft.fontSize)}
            onTouchEnd={() => commit("fontSize", draft.fontSize)}
            onBlur={() => commit("fontSize", draft.fontSize)}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Font Weight
          </label>
          <div className="grid grid-cols-5 gap-1">
            {fontWeights.map((weight) => (
              <button
                key={weight}
                type="button"
                onClick={() => {
                  setDraft((current) => ({ ...current, fontWeight: weight }));
                  commit("fontWeight", weight);
                }}
                className={`h-7 rounded text-[10px] transition-all duration-150 ${
                  draft.fontWeight === weight
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                }`}
                style={{ fontWeight: weight }}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Style
            </label>
            <div className="flex gap-1">
              {(["normal", "italic"] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => {
                    setDraft((current) => ({ ...current, fontStyle: style }));
                    commit("fontStyle", style);
                  }}
                  className={`flex-1 h-8 rounded text-xs flex items-center justify-center gap-1 transition-all ${
                    draft.fontStyle === style
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border/40"
                  }`}
                >
                  {style === "italic" ? <Italic className="w-3 h-3" /> : <Bold className="w-3 h-3" />}
                  {style === "italic" ? "Italic" : "Normal"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Align
            </label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((align) => {
                const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                return (
                  <button
                    key={align}
                    type="button"
                    onClick={() => {
                      setDraft((current) => ({ ...current, textAlign: align }));
                      commit("textAlign", align);
                    }}
                    className={`flex-1 h-8 rounded flex items-center justify-center transition-all ${
                      draft.textAlign === align
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border/40"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Text Color
          </label>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg border border-border/60 overflow-hidden shrink-0" style={{ backgroundColor: draft.color }}>
              <input
                type="color"
                value={draft.color}
                onChange={(e) => setDraft((current) => ({ ...current, color: e.target.value }))}
                onBlur={() => commit("color", draft.color)}
                className="w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <input
              value={draft.color}
              onChange={(e) => setDraft((current) => ({ ...current, color: e.target.value }))}
              onBlur={() => commit("color", draft.color)}
              className="flex-1 h-9 px-3 rounded-lg bg-input border border-border/60 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Background Color
          </label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-border/60 overflow-hidden shrink-0"
              style={{ backgroundColor: draft.backgroundColor === "transparent" ? "transparent" : draft.backgroundColor }}
            >
              <input
                value={draft.backgroundColor}
                onChange={(e) => setDraft((current) => ({ ...current, backgroundColor: e.target.value }))}
                onBlur={() => commit("backgroundColor", draft.backgroundColor || "transparent")}
                className="w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <input
              value={draft.backgroundColor}
              onChange={(e) => setDraft((current) => ({ ...current, backgroundColor: e.target.value }))}
              onBlur={() => commit("backgroundColor", draft.backgroundColor || "transparent")}
              className="flex-1 h-9 px-3 rounded-lg bg-input border border-border/60 text-sm font-mono text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder="transparent"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
            Letter Spacing
            <span className="text-primary font-mono">{draft.letterSpacing}px</span>
          </label>
          <input
            type="range"
            min={-5}
            max={20}
            step={0.5}
            value={draft.letterSpacing}
            onChange={(e) => setDraft((current) => ({ ...current, letterSpacing: Number(e.target.value) }))}
            onMouseUp={() => commit("letterSpacing", draft.letterSpacing)}
            onTouchEnd={() => commit("letterSpacing", draft.letterSpacing)}
            onBlur={() => commit("letterSpacing", draft.letterSpacing)}
            className="w-full"
          />
        </div>

        <div className="text-[10px] text-muted-foreground space-y-1 rounded-lg border border-border/40 bg-muted/20 p-3">
          <div>Position: {Math.round(layer.position.px)} × {Math.round(layer.position.py)} px</div>
          <div>Size: {Math.round(layer.position.pw)} × {Math.round(layer.position.ph)} px</div>
          <div>
            Percent: {layer.position.x.toFixed(2)}% / {layer.position.y.toFixed(2)}% / {layer.position.width.toFixed(2)}% / {layer.position.height.toFixed(2)}%
          </div>
        </div>

        <button
          type="button"
          className="w-full h-8 text-xs rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 gap-1.5 flex items-center justify-center transition-colors"
          onClick={() => {
            setDraft((current) => ({ ...current, editedText: layer.originalText ?? "" }));
            onUpdate("editedText", layer.originalText ?? "");
          }}
        >
          <RefreshCw className="w-3 h-3" />
          Reset to Original
        </button>
      </div>
    </div>
  );
}

function SidebarEmpty({
  layers,
  onSelectLayer,
  analysisComplete,
  isAnalyzing,
  onAnalyze,
}: {
  layers: Layer[];
  onSelectLayer: (id: number) => void;
  analysisComplete: boolean;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <p className="text-xs font-semibold text-foreground">Layers</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {analysisComplete ? `${layers.length} layer${layers.length !== 1 ? "s" : ""} detected` : "Run AI detection to begin"}
        </p>
      </div>

      {!analysisComplete && !isAnalyzing && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No layers yet</p>
          <p className="text-xs text-muted-foreground mb-4">Use AI vision to detect all text in your image</p>
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs gap-1.5"
            onClick={onAnalyze}
          >
            <Sparkles className="w-3 h-3" />
            Detect Text
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-medium text-foreground">Analyzing image…</p>
          <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
        </div>
      )}

      {analysisComplete && !isAnalyzing && layers.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No layers detected</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Run detection again to try a different pass.</p>
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs gap-1.5"
            onClick={onAnalyze}
          >
            <Sparkles className="w-3 h-3" />
            Detect Text
          </button>
        </div>
      )}

      {analysisComplete && layers.length > 0 && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {layers.map((layer, i) => {
            const hasEdit = isLayerModified(layer);
            return (
              <motion.button
                key={layer.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                type="button"
                onClick={() => onSelectLayer(layer.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/40 hover:border-primary/30 transition-all duration-150 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {getLayerDisplayText(layer)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {layer.styling.fontFamily ?? "Unknown"} · {layer.styling.fontWeight ?? "400"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasEdit && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    <div
                      className="w-4 h-4 rounded border border-border/60 shrink-0"
                      style={{ backgroundColor: layer.styling.color ?? "#888" }}
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LayerEditorApp() {
  const params = useParams<{ projectId?: string }>();
  const parsedProjectId = params.projectId ? Number.parseInt(params.projectId, 10) : undefined;
  const projectId = Number.isFinite(parsedProjectId ?? Number.NaN) ? parsedProjectId : undefined;
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const trpc = useTRPC();

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

  const analyzeImage = trpc.editor.analyzeImage.useMutation();
  const updateRegion = trpc.editor.updateTextRegion.useMutation();

  const {
    layers,
    selectedLayer,
    selectedLayerId,
    selectLayer,
    deselectLayer,
    toggleLayer,
    updateLayerStyle,
    updateLayerTextContent,
    initializeFromRegions,
  } = useLayerState({
    initialRegions: [],
    containerWidth: imgSize.w,
    containerHeight: imgSize.h,
  });

  const projectData = project as any;
  const projectOwnerId = projectData?.userId;
  const canEditProject = !projectData || !user || projectOwnerId === user.id;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (rawRegions) {
      initializeFromRegions(rawRegions);
      if (rawRegions.length > 0) {
        setAnalysisComplete(true);
      }
    }
  }, [rawRegions, initializeFromRegions]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      const img = containerRef.current?.querySelector("img");
      if (img) {
        setImgSize({ w: (img as HTMLImageElement).clientWidth, h: (img as HTMLImageElement).clientHeight });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleImageLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setImgSize({ w: img.clientWidth, h: img.clientHeight });
    setImgLoaded(true);
  }, []);

  const handleAnalyze = async () => {
    if (!projectId) return;
    if (!canEditProject) {
      toast.error("You do not have permission to modify this project");
      return;
    }

    setIsAnalyzing(true);
    deselectLayer();

    try {
      const result = await analyzeImage.mutateAsync({ projectId });
      await refetchRegions();
      await refetchProject();
      setAnalysisComplete(true);
      if (result.regions.length === 0) {
        toast.info("No text detected in this image.");
      } else {
        toast.success(`Detected ${result.regions.length} text region${result.regions.length > 1 ? "s" : ""}.`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLayerUpdate = async (id: number, field: EditableField, value: string | number) => {
    if (!canEditProject) {
      toast.error("Permission denied");
      return;
    }

    const finalValue = typeof value === "string" ? normalizeText(value) : value;

    if (field === "editedText") {
      updateLayerTextContent(id, String(finalValue));
    } else if (isStyleField(field)) {
      updateLayerStyle(id, { [field]: finalValue } as Partial<TextStyling>);
    }

    try {
      await updateRegion.mutateAsync({ id, [field]: finalValue } as any);
    } catch {
      toast.error("Failed to save change");
      await refetchRegions();
    }
  };

  const sortedLayers = useMemo(() => [...layers].sort((a, b) => a.zIndex - b.zIndex), [layers]);

  const handleExport = useCallback(async (format: "png" | "jpg") => {
    if (!projectData || !imgSize.w || !imgSize.h) return;
    setIsExporting(true);

    try {
      const canvas = document.createElement("canvas");
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = projectData.originalImageUrl;
      });

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      ctx.drawImage(img, 0, 0);
      const scaleX = img.naturalWidth / imgSize.w;
      const scaleY = img.naturalHeight / imgSize.h;
      const scale = Math.min(scaleX, scaleY);

      await Promise.all(
        sortedLayers.map((layer) => ensureFontLoaded(layer.styling.fontFamily ?? "sans-serif", String(layer.styling.fontWeight ?? "400"), layer.styling.fontStyle ?? "normal"))
      );

      for (const layer of sortedLayers) {
        const text = normalizeText(getLayerDisplayText(layer));
        if (!text) continue;

        const x = layer.position.px * scaleX;
        const y = layer.position.py * scaleY;
        const w = layer.position.pw * scaleX;
        const h = layer.position.ph * scaleY;
        const fontSize = (layer.styling.fontSize ?? 16) * scale;

        if (layer.styling.backgroundColor && layer.styling.backgroundColor !== "transparent") {
          ctx.fillStyle = layer.styling.backgroundColor;
          ctx.fillRect(x, y, w, h);
        }

        ctx.font = `${layer.styling.fontStyle ?? "normal"} ${layer.styling.fontWeight ?? "400"} ${fontSize}px "${layer.styling.fontFamily ?? "sans-serif"}", sans-serif`;
        ctx.fillStyle = layer.styling.color ?? "#000000";
        ctx.textAlign = (layer.styling.textAlign as CanvasTextAlign) ?? "left";
        ctx.textBaseline = "top";

        if ("letterSpacing" in ctx) {
          (ctx as any).letterSpacing = `${(layer.styling.letterSpacing ?? 0) * scale}px`;
        }

        const drawX =
          layer.styling.textAlign === "center" ? x + w / 2 :
          layer.styling.textAlign === "right" ? x + w :
          x;

        ctx.fillText(text, drawX, y + h * 0.1, w);
      }

      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, format === "jpg" ? 0.95 : undefined);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${projectData.title || "edited"}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Image exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error(error);
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [imgSize, projectData, sortedLayers]);

  if (authLoading || projectLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading editor…</p>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-foreground font-medium mb-4">Project not found</p>
          <button
            type="button"
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-border/60 hover:bg-muted/40"
            onClick={() => navigate("/")}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <LocalEditorErrorBoundary>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card/60 backdrop-blur-sm shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="h-8 w-8 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40"
              onClick={() => navigate("/")}
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center shrink-0">
                <Type className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {projectData.title}
              </span>
            </div>
            {projectData.status === "ready" && analysisComplete && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                <CheckCircle2 className="w-3 h-3" />
                {layers.length} layer{layers.length !== 1 ? "s" : ""} detected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              onClick={() => setShowOverlays((value) => !value)}
            >
              {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showOverlays ? "Hide" : "Show"} Layers
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs border border-border/60 hover:bg-muted/40"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
              {isAnalyzing ? "Analyzing…" : analysisComplete ? "Re-analyze" : "Detect Text"}
            </button>

            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                disabled={isExporting || !imgLoaded}
                onClick={() => handleExport("png")}
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Export
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>
              <div className="absolute right-0 mt-2 w-32 rounded-md border border-border/60 bg-card shadow-lg overflow-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-30">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted/40"
                  onClick={() => handleExport("png")}
                >
                  <FileImage className="w-3.5 h-3.5 text-muted-foreground" />
                  PNG Image
                </button>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-muted/40"
                  onClick={() => handleExport("jpg")}
                >
                  <FileType className="w-3.5 h-3.5 text-muted-foreground" />
                  JPG Image
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          <div className="flex-1 overflow-auto bg-[oklch(0.08_0.005_260)] flex items-start justify-center p-8">
            <div ref={containerRef} className="relative inline-block">
              <img
                src={projectData.originalImageUrl}
                alt={projectData.title ?? "Uploaded image"}
                className="block max-w-full max-h-[calc(100vh-140px)] object-contain select-none rounded-lg shadow-2xl"
                onLoad={handleImageLoad}
                draggable={false}
                crossOrigin="anonymous"
              />

              <AnimatePresence>
                {isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-lg bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Analyzing with AI Vision</p>
                      <p className="text-xs text-muted-foreground mt-1">Detecting fonts and text regions…</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showOverlays && imgLoaded && sortedLayers.map((layer) => {
                  const selected = layer.id === selectedLayerId;
                  const displayText = normalizeText(getLayerDisplayText(layer));
                  const hasEdit = isLayerModified(layer);

                  return (
                    <motion.div
                      key={layer.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: "absolute",
                        left: layer.position.px,
                        top: layer.position.py,
                        width: layer.position.pw,
                        height: layer.position.ph,
                      }}
                      className={`cursor-pointer group border transition-all duration-200 ${
                        selected
                          ? "border-primary shadow-[0_0_0_2px_oklch(0.78_0.12_75/0.4)] z-10"
                          : "border-primary/40 hover:border-primary/80 hover:shadow-[0_0_0_1px_oklch(0.78_0.12_75/0.25)]"
                      }`}
                      onClick={() => toggleLayer(layer.id)}
                    >
                      <div className={`absolute inset-0 transition-all duration-200 ${selected ? "bg-primary/15" : "bg-primary/5 group-hover:bg-primary/10"}`} />

                      {hasEdit && (
                        <div
                          className="absolute inset-0 flex items-center overflow-hidden px-1"
                          style={{
                            fontFamily: `"${layer.styling.fontFamily ?? "sans-serif"}", sans-serif`,
                            fontSize: `${Math.min(layer.styling.fontSize ?? 14, layer.position.ph * 0.8)}px`,
                            fontWeight: layer.styling.fontWeight ?? "400",
                            fontStyle: layer.styling.fontStyle ?? "normal",
                            color: layer.styling.color ?? "#ffffff",
                            textAlign: (layer.styling.textAlign as any) ?? "left",
                            letterSpacing: `${layer.styling.letterSpacing ?? 0}px`,
                            lineHeight: layer.styling.lineHeight ?? 1.2,
                            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                          }}
                        >
                          {displayText}
                        </div>
                      )}

                      {selected && (
                        <div className="absolute -top-6 left-0 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-t whitespace-nowrap">
                          {layer.styling.fontFamily ?? "Unknown font"} · {Math.round((layer.confidence ?? 0) * 100)}% confidence
                        </div>
                      )}

                      {hasEdit && !selected && <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border border-background" />}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {imgLoaded && !isAnalyzing && !analysisComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="bg-background/80 backdrop-blur-sm border border-border/60 rounded-xl px-6 py-4 text-center pointer-events-auto">
                    <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground mb-1">Ready to analyze</p>
                    <p className="text-xs text-muted-foreground mb-3">Click Detect Text to find all text layers</p>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs gap-1.5"
                      onClick={handleAnalyze}
                    >
                      <Sparkles className="w-3 h-3" />
                      Detect Text
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border/50 bg-card/40 backdrop-blur-sm flex flex-col overflow-hidden shrink-0 max-h-[40vh] lg:max-h-none">
            <AnimatePresence mode="wait">
              {selectedLayer ? (
                <motion.div
                  key={`layer-${selectedLayer.id}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-col h-full overflow-y-auto"
                >
                  <LayerEditor
                    layer={selectedLayer}
                    onUpdate={(field, value) => handleLayerUpdate(selectedLayer.id, field, value)}
                    onClose={deselectLayer}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="sidebar-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full"
                >
                  <SidebarEmpty
                    layers={sortedLayers}
                    onSelectLayer={selectLayer}
                    analysisComplete={analysisComplete}
                    isAnalyzing={isAnalyzing}
                    onAnalyze={handleAnalyze}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </div>
    </LocalEditorErrorBoundary>
  );
}

export default function LayerBasedEditor() {
  return <LayerEditorApp />;
}
