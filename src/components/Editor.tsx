import { useState } from "react";
import { EditorErrorBoundary } from "@/components/EditorErrorBoundary";
import { EditorHeader } from "@/components/EditorHeader";
import { EditorSidebar } from "@/components/EditorSidebar";
import { TextArea } from "@/components/TextArea";
import { useEditorInitializer } from "@/hooks/useEditorStore";
import type { Block } from "@/types/block";

export default function Editor() {
  const { project, authLoading, projectLoading } = useEditorInitializer();

  const [blocks, setBlocks] = useState<Block[]>(() => project?.blocks ?? []);

  if (authLoading || projectLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <EditorErrorBoundary>
        <EditorHeader project={project} />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <TextArea blocks={blocks} setBlocks={setBlocks} />
          <EditorSidebar />
        </div>
      </EditorErrorBoundary>
    </div>
  );
}
