import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { FontPicker } from "@/components/FontPicker";
import { loadGoogleFont } from "@/components/FontLoader";
import { EditorErrorBoundary } from "@/components/EditorErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Type, Download, ArrowLeft, ChevronDown,
  Loader2, AlertCircle, CheckCircle2, RefreshCw, Eye, EyeOff,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, LetterText,
  FileImage, FileType
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import type { TextRegion } from "../../../drizzle/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CanvasRegion extends TextRegion {
  px: number;
  py: number;
  pw: number;
  ph: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalizes strings to NFC form. 
 * Crucial for iOS inputs which often use NFD (decomposed) characters.
 */
function normalizeText(text: string): string {
  return text.normalize("NFC");
}

// ─── Main Editor Component ────────────────────────────────────────────────────

function EditorContent() {
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId ? parseInt(params.projectId) : undefined;
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);

  const [regions, setRegions] = useState<CanvasRegion[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ─── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // ─── Data fetching ───────────────────────────────────────────────────────────
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

  // ─── Compute pixel coords ───────────────────────────────────────────────────
  const computeRegions = useCallback(
    (raw: TextRegion[], w: number, h: number): CanvasRegion[] =>
      raw.map((r) => ({
        ...r,
        px: (r.x / 100) * w,
        py: (r.y / 100) * h,
        pw: (r.width / 100) * w,
        ph: (r.height / 100) * h,
      })),
    []
  );

  useEffect(() => {
    if (rawRegions && imgSize.w > 0) {
      const computed = computeRegions(rawRegions, imgSize.w, imgSize.h);
      setRegions(computed);
      setAnalysisComplete(computed.length > 0);
      computed.forEach((r) => {
        if (r.fontFamily) {
          loadGoogleFont(r.fontFamily, r.fontWeight ?? "400", r.fontStyle ?? "normal");
        }
      });
    }
  }, [rawRegions, imgSize, computeRegions]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgSize({ w: img.clientWidth, h: img.clientHeight });
    setImgLoaded(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(() => {
      const img = containerRef.current?.querySelector("img");
      if (img) setImgSize({ w: img.clientWidth, h: img.clientHeight });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ─── Analyze ─────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!projectId) return;
    // Ownership check
    if (project && user && project.userId !== user.id) {
      toast.error("You do not have permission to modify this project");
      return;
    }

    setIsAnalyzing(true);
    setSelectedId(null);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Selected region ─────────────────────────────────────────────────────────
  const selectedRegion = regions.find((r) => r.id === selectedId) ?? null;

  const handleRegionUpdate = async (
    id: number,
    field: string,
    value: string | number
  ) => {
    // Ownership check
    if (project && user && project.userId !== user.id) {
      toast.error("Permission denied");
      return;
    }

    // Normalize text if the field is text-related
    const finalValue = typeof value === "string" ? normalizeText(value) : value;

    setRegions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: finalValue } : r))
    );
    try {
      await updateRegion.mutateAsync({ id, [field]: finalValue } as any);
    } catch {
      toast.error("Failed to save change");
      refetchRegions();
    }
  };

  // ─── Export ──────────────────────────────────────────────────────────────────
  const handleExport = useCallback(async (format: "png" | "jpg") => {
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

      // Ensure fonts are loaded
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

        const x = (region.x / 100) * canvas.width;
        const y = (region.y / 100) * canvas.height;
        const w = (region.width / 100) * canvas.width;
        const h = (region.height / 100) * canvas.height;
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
  }, [project, regions, imgSize]);

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

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-foreground font-medium mb-4">Project not found</p>
          <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <EditorErrorBoundary>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card/60 backdrop-blur-sm shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                <Type className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                {project.title}
              </span>
            </div>
            {project.status === "ready" && analysisComplete && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                <CheckCircle2 className="w-3 h-3" />
                {regions.length} region{regions.length !== 1 ? "s" : ""} detected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground text-xs"
              onClick={() => setShowOverlays((v) => !v)}
            >
              {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showOverlays ? "Hide" : "Show"} Regions
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-border/60"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              )}
              {isAnalyzing ? "Analyzing…" : analysisComplete ? "Re-analyze" : "Detect Text"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isExporting || !imgLoaded}
                >
                  {isExporting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Export
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 bg-card border-border/60">
                <DropdownMenuItem 
                  className="text-xs gap-2 cursor-pointer"
                  onClick={() => handleExport("png")}
                >
                  <FileImage className="w-3.5 h-3.5 text-muted-foreground" />
                  PNG Image
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-xs gap-2 cursor-pointer"
                  onClick={() => handleExport("jpg")}
                >
                  <FileType className="w-3.5 h-3.5 text-muted-foreground" />
                  JPG Image
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          <div className="flex-1 overflow-auto bg-[oklch(0.08_0.005_260)] flex items-start justify-center p-8">
            <div ref={containerRef} className="relative inline-block">
              <img
                src={project.originalImageUrl}
                alt={project.title ?? "Uploaded image"}
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
                    <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                      <motion.div
                        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                        animate={{ top: ["0%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showOverlays && imgLoaded && regions.map((region) => {
                  const isSelected = region.id === selectedId;
                  const displayText = normalizeText(region.editedText ?? region.originalText ?? "");
                  const hasEdit = !!region.editedText && region.editedText !== region.originalText;

                  return (
                    <motion.div
                      key={region.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: "absolute",
                        left: region.px,
                        top: region.py,
                        width: region.pw,
                        height: region.ph,
                      }}
                      className={`
                        cursor-pointer group
                        border transition-all duration-200
                        ${isSelected
                          ? "border-primary shadow-[0_0_0_2px_oklch(0.78_0.12_75/0.4)] z-10"
                          : "border-primary/40 hover:border-primary/80 hover:shadow-[0_0_0_1px_oklch(0.78_0.12_75/0.25)]"
                        }
                      `}
                      onClick={() => setSelectedId(isSelected ? null : region.id)}
                    >
                      <div
                        className={`
                          absolute inset-0 transition-all duration-200
                          ${isSelected ? "bg-primary/15" : "bg-primary/5 group-hover:bg-primary/10"}
                        `}
                      />

                      {hasEdit && (
                        <div
                          className="absolute inset-0 flex items-center overflow-hidden px-1"
                          style={{
                            fontFamily: `"${region.fontFamily ?? "sans-serif"}", sans-serif`,
                            fontSize: `${Math.min(region.fontSize ?? 14, region.ph * 0.8)}px`,
                            fontWeight: region.fontWeight ?? "400",
                            fontStyle: region.fontStyle ?? "normal",
                            color: region.color ?? "#ffffff",
                            textAlign: (region.textAlign as any) ?? "left",
                            letterSpacing: `${region.letterSpacing ?? 0}px`,
                            lineHeight: region.lineHeight ?? 1.2,
                            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                          }}
                        >
                          {displayText}
                        </div>
                      )}

                      {isSelected && (
                        <div
                          className="absolute -top-6 left-0 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded-t whitespace-nowrap"
                        >
                          {region.fontFamily ?? "Unknown font"} · {Math.round((region.confidence ?? 0) * 100)}% confidence
                        </div>
                      )}

                      {hasEdit && !isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full border border-background" />
                      )}
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
                    <p className="text-xs text-muted-foreground mb-3">Click "Detect Text" to find all text regions</p>
                    <Button size="sm" className="bg-primary text-primary-foreground text-xs gap-1.5" onClick={handleAnalyze}>
                      <Sparkles className="w-3 h-3" />
                      Detect Text
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border/50 bg-card/40 backdrop-blur-sm flex flex-col overflow-hidden shrink-0 max-h-[40vh] lg:max-h-none">
            <AnimatePresence mode="wait">
              {selectedRegion ? (
                <motion.div
                  key={`region-${selectedRegion.id}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-col h-full overflow-y-auto"
                >
                  <TextRegionEditor
                    region={selectedRegion}
                    onUpdate={handleRegionUpdate}
                    onClose={() => setSelectedId(null)}
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
                    regions={regions}
                    onSelectRegion={setSelectedId}
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
    </EditorErrorBoundary>
  );
}

export default function Editor() {
  return <EditorContent />;
}

// ─── Text Region Editor Panel ─────────────────────────────────────────────────

function TextRegionEditor({
  region,
  onUpdate,
  onClose,
}: {
  region: CanvasRegion;
  onUpdate: (id: number, field: string, value: string | number) => void;
  onClose: () => void;
}) {
  const [editedText, setEditedText] = useState(region.editedText ?? region.originalText ?? "");
  const [fontFamily, setFontFamily] = useState(region.fontFamily ?? "");
  const [fontSize, setFontSize] = useState(region.fontSize ?? 16);
  const [fontWeight, setFontWeight] = useState(region.fontWeight ?? "400");
  const [fontStyle, setFontStyle] = useState(region.fontStyle ?? "normal");
  const [color, setColor] = useState(region.color ?? "#ffffff");
  const [textAlign, setTextAlign] = useState(region.textAlign ?? "left");
  const [letterSpacing, setLetterSpacing] = useState(region.letterSpacing ?? 0);

  useEffect(() => {
    setEditedText(region.editedText ?? region.originalText ?? "");
    setFontFamily(region.fontFamily ?? "");
    setFontSize(region.fontSize ?? 16);
    setFontWeight(region.fontWeight ?? "400");
    setFontStyle(region.fontStyle ?? "normal");
    setColor(region.color ?? "#ffffff");
    setTextAlign(region.textAlign ?? "left");
    setLetterSpacing(region.letterSpacing ?? 0);
  }, [region.id]);

  const save = (field: string, value: string | number) => {
    onUpdate(region.id, field, value);
  };

  const fontWeights = ["100","200","300","400","500","600","700","800","900"];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs font-semibold text-foreground">Edit Text Region</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {region.fontFamily ?? "Unknown"} · {Math.round(((region.confidence ?? 0)) * 100)}% confidence
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <span className="text-muted-foreground text-sm">×</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Original Text
          </label>
          <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border/40 text-xs text-muted-foreground font-mono">
            {region.originalText}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            New Text
          </label>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onBlur={() => save("editedText", editedText)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-input border border-border/60 text-sm text-foreground resize-none focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
            style={{
              fontFamily: `"${fontFamily}", sans-serif`,
              fontWeight,
              fontStyle,
              color,
              letterSpacing: `${letterSpacing}px`,
            }}
            placeholder="Enter replacement text…"
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
            Font Size
            <span className="text-primary font-mono">{Math.round(fontSize)}px</span>
          </label>
          <Slider
            value={[fontSize]}
            min={6}
            max={200}
            step={1}
            onValueChange={([val]) => setFontSize(val)}
            onValueCommit={([val]) => save("fontSize", val)}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Font Weight
          </label>
          <div className="grid grid-cols-5 gap-1">
            {fontWeights.map((w) => (
              <button
                key={w}
                onClick={() => { setFontWeight(w); save("fontWeight", w); }}
                className={`
                  h-7 rounded text-[10px] transition-all duration-150
                  ${fontWeight === w
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                  }
                `}
                style={{ fontWeight: w }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Style</label>
            <div className="flex gap-1">
              {(["normal", "italic"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setFontStyle(s); save("fontStyle", s); }}
                  className={`
                    flex-1 h-8 rounded text-xs flex items-center justify-center gap-1 transition-all
                    ${fontStyle === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border/40"
                    }
                  `}
                >
                  {s === "italic" ? <Italic className="w-3 h-3" /> : <Bold className="w-3 h-3" />}
                  {s === "italic" ? "Italic" : "Normal"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Align</label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((a) => {
                const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                return (
                  <button
                    key={a}
                    onClick={() => { setTextAlign(a); save("textAlign", a); }}
                    className={`
                      flex-1 h-8 rounded flex items-center justify-center transition-all
                      ${textAlign === a
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted border border-border/40"
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Text Color</label>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-border/60 cursor-pointer relative overflow-hidden shrink-0"
              style={{ backgroundColor: color }}
            >
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                onBlur={() => save("color", color)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              onBlur={() => save("color", color)}
              className="h-8 text-xs bg-input border-border/60 font-mono"
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
            Letter Spacing
            <span className="text-primary font-mono">{letterSpacing}px</span>
          </label>
          <Slider
            value={[letterSpacing]}
            min={-5}
            max={20}
            step={0.5}
            onValueChange={([val]) => setLetterSpacing(val)}
            onValueCommit={([val]) => save("letterSpacing", val)}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs border-border/60 text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => {
            setEditedText(region.originalText ?? "");
            onUpdate(region.id, "editedText", region.originalText ?? "");
          }}
        >
          <RefreshCw className="w-3 h-3" />
          Reset to Original
        </Button>
      </div>
    </div>
  );
}

function SidebarEmpty({
  regions,
  onSelectRegion,
  analysisComplete,
  isAnalyzing,
  onAnalyze,
}: {
  regions: CanvasRegion[];
  onSelectRegion: (id: number) => void;
  analysisComplete: boolean;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <p className="text-xs font-semibold text-foreground">Text Regions</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {analysisComplete ? `${regions.length} region${regions.length !== 1 ? "s" : ""} detected` : "Run AI detection to begin"}
        </p>
      </div>

      {!analysisComplete && !isAnalyzing && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No regions yet</p>
          <p className="text-xs text-muted-foreground mb-4">Use AI vision to detect all text in your image</p>
          <Button size="sm" className="bg-primary text-primary-foreground text-xs gap-1.5" onClick={onAnalyze}>
            <Sparkles className="w-3 h-3" />
            Detect Text
          </Button>
        </div>
      )}

      {isAnalyzing && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-medium text-foreground">Analyzing image…</p>
          <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
        </div>
      )}

      {analysisComplete && regions.length > 0 && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {regions.map((region, i) => {
            const hasEdit = !!region.editedText && region.editedText !== region.originalText;
            return (
              <motion.button
                key={region.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelectRegion(region.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/40 hover:border-primary/30 transition-all duration-150 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {region.editedText ?? region.originalText}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {region.fontFamily ?? "Unknown"} · {region.fontWeight ?? "400"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasEdit && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                    <div
                      className="w-4 h-4 rounded border border-border/60 shrink-0"
                      style={{ backgroundColor: region.color ?? "#888" }}
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
