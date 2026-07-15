import { useState } from "react";
import { useEditorInitializer } from "@/hooks/useEditorStore";
import { EditorHeader } from "@/components/EditorHeader";
import { EditorSidebar } from "@/components/EditorSidebar";
import { TextArea } from "@/components/TextArea";
import type { Block } from "@/types/block";

export default function Editor() {
  const { project, authLoading, projectLoading, isSaving } = useEditorInitializer();

  const [blocks, setBlocks] = useState<Block[]>(
    project?.blocks ?? []
  );

  if (authLoading || projectLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Loading editor...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorHeader project={project} isSaving={isSaving} />

      <div className="flex flex-1 overflow-hidden">
        <TextArea blocks={blocks} setBlocks={setBlocks} />
        <EditorSidebar />
      </div>
    </div>
  );
}