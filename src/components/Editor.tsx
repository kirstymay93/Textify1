import { useState } from "react";
import { useEditorInitializer } from "@/hooks/useEditorStore";
import { EditorHeader } from "@/components/EditorHeader";
import { EditorSidebar } from "@/components/EditorSidebar";
import { TextArea } from "@/components/TextArea";

export function EditorContent() {
  const { project, authLoading, projectLoading } = useEditorInitializer();

  const [blocks, setBlocks] = useState(project.blocks);

  if (authLoading || projectLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
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
        {/* TEXT EDITOR (core system) */}
        <TextArea blocks={blocks} setBlocks={setBlocks} />

        {/* Sidebar (UI only for now) */}
        <EditorSidebar />
      </div>
    </div>
  );
}

export default function Editor() {
  return <EditorContent />;
}