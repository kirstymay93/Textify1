import { useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Block } from "@/types/block";

interface TextAreaProps {
  blocks: Block[];
  setBlocks: Dispatch<SetStateAction<Block[]>>;
}

export function TextArea({ blocks, setBlocks }: TextAreaProps) {
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const focusBlock = (id: string) => {
    window.requestAnimationFrame(() => {
      refs.current[id]?.focus();
    });
  };

  const updateBlock = (id: string, value: string) => {
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, content: value } : block)));
  };

  const createBlockAfter = (index: number) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      content: "",
    };

    setBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newBlock);
      return next;
    });

    focusBlock(newBlock.id);
  };

  const mergeWithPrevious = (index: number) => {
    if (index === 0) return;

    setBlocks((prev) => {
      const previous = prev[index - 1];
      const current = prev[index];

      if (!previous || !current) {
        return prev;
      }

      const merged: Block = {
        ...previous,
        content: previous.content + current.content,
      };

      const next = [
        ...prev.slice(0, index - 1),
        merged,
        ...prev.slice(index + 1),
      ];

      focusBlock(merged.id);
      return next;
    });
  };

  if (blocks.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          No blocks yet. Create your first block to start writing.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto p-6 lg:p-8">
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <textarea
            key={block.id}
            ref={(element) => {
              refs.current[block.id] = element;
            }}
            value={block.content}
            onChange={(e) => updateBlock(block.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createBlockAfter(index);
              }

              if (e.key === "Backspace" && block.content === "" && index > 0) {
                e.preventDefault();
                mergeWithPrevious(index);
              }
            }}
            aria-label={`Block ${index + 1}`}
            placeholder={index === 0 ? "Start typing here…" : "Continue writing…"}
            spellCheck
            className="min-h-[96px] w-full resize-none rounded-md border border-border bg-background p-3 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        ))}
      </div>
    </div>
  );
}
