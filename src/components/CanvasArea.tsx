interface TextAreaProps {
  blocks: { id: string; content: string }[];
  onChange: (id: string, value: string) => void;
}

export function TextArea({ blocks, onChange }: TextAreaProps) {
  return (
    <div className="flex-1 p-8 space-y-4">
      {blocks.map((block) => (
        <textarea
          key={block.id}
          value={block.content}
          onChange={(e) => onChange(block.id, e.target.value)}
          className="w-full min-h-[80px] p-3 rounded-md bg-background border border-border text-sm resize-none outline-none"
        />
      ))}
    </div>
  );
}