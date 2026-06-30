
import { EditorErrorBoundary } from "@/components/EditorErrorBoundary";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorInitializer, useEditorStore } from "@/hooks/useEditorStore";
import { EditorHeader } from "./EditorHeader";
import { CanvasArea } from "./CanvasArea";
import { EditorSidebar } from "./EditorSidebar";

export function EditorContent() {
  const { projectLoading, project, authLoading, containerRef } = useEditorInitializer();
  const { navigate } = useEditorStore();

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
        <EditorHeader
          project={project}
        />

        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          <CanvasArea
            originalImageUrl={project.originalImageUrl}
            title={project.title ?? ""}
            containerRef={containerRef}
          />

          <EditorSidebar />
        </div>
      </div>
    </EditorErrorBoundary>
  );
}

export default function Editor() {
  return <EditorContent />;
}

