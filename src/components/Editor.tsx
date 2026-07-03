import { useEditorInitializer } from "@/hooks/useEditorStore";
import { EditorHeader } from "@/components/EditorHeader";
import { EditorSidebar } from "@/components/EditorSidebar";
import { TextArea } from "@/components/TextArea";
import { useState } from "react";

export function EditorContent() {
  const { project } = useEditorInitializer();

  const [blocks, setBlocks] = useState(project.blocks);

  const updateBlock = (id: string, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: value } : b))
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <EditorHeader project={project} />

      <div className="flex flex-1">
        <TextArea blocks={blocks} onChange={updateBlock} />
        <EditorSidebar />
      </div>
    </div>
  );
}

export default function Editor() {
  return <EditorContent />;
}