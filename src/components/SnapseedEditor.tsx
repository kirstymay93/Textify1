import { useState, useRef, useEffect } from "react";
import { EditorHeader } from "@/components/EditorHeader";
import { ImageAdjustments } from "@/components/ImageAdjustments";
import { ProjectOverview } from "@/components/ProjectOverview";
import { useImageAdjustments } from "@/hooks/useImageAdjustments";
import { useProjectHistory } from "@/hooks/useProjectHistory";
import { useEditorInitializer } from "@/hooks/useEditorStore";
import type { Block } from "@/types/block";

export function SnapseedEditor() {
  const { project, isSaving, lastSavedAt, saveNow } = useEditorInitializer();
  const { adjustments, updateAdjustment, resetAdjustments, getFilterString } =
    useImageAdjustments();
  const { history, addSnapshot, getSnapshot } = useProjectHistory();

  const [blocks, setBlocks] = useState<Block[]>(project?.blocks ?? []);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showOverview, setShowOverview] = useState(true);
  const [showAdjustments, setShowAdjustments] = useState(true);

  // Auto-save snapshot on adjustment changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedImageUrl) {
        addSnapshot(
          `Edit at ${new Date().toLocaleTimeString()}`,
          selectedImageUrl
        );
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [adjustments, selectedImageUrl, addSnapshot]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImageUrl(event.target?.result as string);
        resetAdjustments();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = async () => {
    if (!canvasRef.current || !selectedImageUrl) return;

    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `${project?.title || "export"}-${Date.now()}.png`;
    link.click();

    await saveNow();
  };

  const handleShare = () => {
    if (navigator.share && selectedImageUrl) {
      navigator.share({
        title: project?.title || "Textify Project",
        text: "Check out my edited image!",
        url: window.location.href,
      });
    } else {
      alert("Share functionality not available on this browser");
    }
  };

  const filterString = getFilterString();

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorHeader project={project} isSaving={isSaving} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Project Overview */}
        {showOverview && (
          <div className="w-64 border-r border-border overflow-hidden">
            <ProjectOverview
              projectTitle={project?.title || "Untitled"}
              lastSavedAt={lastSavedAt}
              history={history}
              onSnapshotSelect={(snapshotId) => {
                const snapshot = getSnapshot(snapshotId);
                if (snapshot?.thumbnail) {
                  setSelectedImageUrl(snapshot.thumbnail);
                }
              }}
              onExport={handleExport}
              onShare={handleShare}
            />
          </div>
        )}

        {/* Center: Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 overflow-auto">
          {selectedImageUrl ? (
            <div className="relative max-w-2xl max-h-full">
              <img
                src={selectedImageUrl}
                alt="Editing"
                style={{
                  filter: filterString,
                  transition: "filter 0.1s ease-out",
                }}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
              <canvas
                ref={canvasRef}
                style={{ display: "none" }}
              />
            </div>
          ) : (
            <div className="text-center">
              <label className="cursor-pointer">
                <div className="inline-flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-border hover:border-foreground/50 transition-colors">
                  <svg
                    className="w-12 h-12 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Upload an image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or drag and drop
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Right Panel: Image Adjustments */}
        {showAdjustments && (
          <div className="w-64 border-l border-border overflow-hidden">
            <ImageAdjustments
              adjustments={adjustments}
              onAdjustmentChange={updateAdjustment}
              onReset={resetAdjustments}
            />
          </div>
        )}
      </div>
    </div>
  );
}
