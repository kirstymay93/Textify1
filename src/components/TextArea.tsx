import { useRef } from "react";

interface Block {
  id: string;
  content: string;
}

interface TextAreaProps {
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
}

export function TextArea({ blocks, setBlocks }: TextAreaProps) {
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const updateBlock = (id: string, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, content: value } : b))
    );
  };

  const createBlockAfter = (index: number) => {
    const newBlock = {
      id: crypto.randomUUID(),
      content: "",
    };

    setBlocks((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, newBlock);
      return copy;
    });

    setTimeout(() => {
      refs.current[newBlock.id]?.focus();
    }, 0);
  };

  const mergeWithPrevious = (index: number) => {
    if (index === 0) return;

    setBlocks((prev) => {
      const copy = [...prev];
      const current = copy[index];
      const prevBlock = copy[index - 1];

      prevBlock.content += current.content;
      copy.splice(index, 1);

      setTimeout(() => {
        refs.current[prevBlock.id]?.focus();
      }, 0);

      return copy;
    });
  };

  return (
    <div className="flex-1 p-8 space-y-4 overflow-auto">
      {blocks.map((block, index) => (
        <textarea
          key={block.id}
          ref={(el) => (refs.current[block.id] = el)}
          value={block.content}
          onChange={(e) => updateBlock(block.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              createBlockAfter(index);
            }

            if (e.key === "Backspace" && block.content === "") {
              e.preventDefault();
              mergeWithPrevious(index);
            }
          }}
          className="w-full min-h-[80px] p-3 rounded-md bg-background border border-border text-sm resize-none outline-none"
        />
      ))}
    </div>
  );
}