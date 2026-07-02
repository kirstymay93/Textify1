interface CanvasAreaProps {
  originalImageUrl: string;
  title: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function CanvasArea({ originalImageUrl, title, containerRef }: CanvasAreaProps) {
  return (
    <div className="flex-1 overflow-auto bg-[oklch(0.08_0.005_260)] flex items-start justify-center p-8">
      <div ref={containerRef} className="relative inline-block">
        <img
          src={originalImageUrl}
          alt={title}
          className="block max-w-full max-h-[calc(100vh-140px)] object-contain select-none rounded-lg shadow-2xl"
          draggable={false}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}
