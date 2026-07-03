import { useState } from "react";
import { useEditorInitializer } from "@/hooks/useEditorStore";
import { EditorHeader } from "@/components/EditorHeader";
import { EditorSidebar } from "@/components/EditorSidebar";
import { TextArea } from "@/components/TextArea";

export function EditorContent() {
  const { project, authLoading, projectLoading } = useEditorInitializer();

  const [blocks, setBlocks] = useState(project.blocks);

  // Loading state (keep what you already had)
  if (authLoading || projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <EditorHeader project={project} />

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* TEXT EDITOR (replaces CanvasArea) */}
        <TextArea blocks={blocks} setBlocks={setBlocks} />

        {/* Sidebar */}
        <EditorSidebar />
      </div>
    </div>
  );
}

// default export (important for routing)
export default function Editor() {
  return <EditorContent />;
}