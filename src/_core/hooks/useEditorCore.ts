import { useCallback, useRef, useState } from "react";

/**
 * SINGLE SOURCE OF TRUTH BLOCK MODEL
 */
export type Block = {
  id: string;
  content: string;
};

export function useEditorCore() {
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: "b1",
      content: "Start writing here...",
    },
  ]);

  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const updateBlock = useCallback((id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b))
    );
  }, []);

  const addBlockAfter = useCallback((afterId: string) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      content: "",
    };

    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === afterId);
      const copy = [...prev];
      copy.splice(index + 1, 0, newBlock);
      return copy;
    });
  }, []);

  const mergeWithPrevious = useCallback((id: string) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index <= 0) return prev;

      const copy = [...prev];
      copy[index - 1].content += copy[index].content;
      copy.splice(index, 1);
      return copy;
    });
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return {
    blocks,
    setBlocks,
    refs,
    updateBlock,
    addBlockAfter,
    mergeWithPrevious,
    deleteBlock,
  };
}