import { useCallback, useRef, useState } from "react";

/**
 * SINGLE SOURCE OF TRUTH
 * This MUST match everywhere in the app.
 */
export type Block = {
  id: string;
  content: string;
};

type UseEditorCoreOptions = {
  initialBlocks?: Block[];
};

export function useEditorCore(options: UseEditorCoreOptions = {}) {
  const { initialBlocks = [] } = options;

  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks.length
      ? initialBlocks
      : [
          {
            id: "b1",
            content: "Start writing here...",
          },
        ]
  );

  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  /**
   * UPDATE BLOCK CONTENT
   */
  const updateBlock = useCallback((id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content } : b))
    );
  }, []);

  /**
   * ADD BLOCK AFTER CURRENT
   */
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

    setTimeout(() => {
      refs.current[newBlock.id]?.focus();
    }, 0);
  }, []);

  /**
   * MERGE WITH PREVIOUS BLOCK
   */
  const mergeWithPrevious = useCallback((id: string) => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index <= 0) return prev;

      const copy = [...prev];
      copy[index - 1].content += copy[index].content;
      copy.splice(index, 1);

      setTimeout(() => {
        const prevBlock = copy[index - 1];
        if (prevBlock) {
          refs.current[prevBlock.id]?.focus();
        }
      }, 0);

      return copy;
    });
  }, []);

  /**
   * DELETE BLOCK
   */
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