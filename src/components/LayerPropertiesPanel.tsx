import { AlignCenter, AlignLeft, AlignRight, RotateCcw } from "lucide-react";
import type { Layer, TextStyling } from "@/lib/layerSystem";

interface LayerPropertiesPanelProps {
  layer: Layer | null;
  onUpdateText: (id: number, text: string) => void;
  onUpdateStyle: (id: number, updates: Partial<TextStyling>) => void;
  onResetToOriginal: (id: number) => void;
}

const FONT_WEIGHTS: TextStyling["fontWeight"][] = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];

export function LayerPropertiesPanel({
  layer,
  onUpdateText,
  onUpdateStyle,
  onResetToOriginal,
}: LayerPropertiesPanelProps) {
  if (!layer) {
    return (
      <section className="h-full border-l border-border/60 bg-card/40 p-4">
        <h2 className="text-sm font-semibold text-foreground">Properties</h2>
        <p className="mt-2 text-xs text-muted-foreground">Select a layer to edit text and styles.</p>
      </section>
    );
  }

  const currentText = layer.editedText ?? layer.originalText ?? "";

  return (
    <section className="h-full overflow-y-auto border-l border-border/60 bg-card/40 p-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Layer {layer.id}</h2>
          <p className="text-xs text-muted-foreground">Text properties</p>
        </div>
        <button
          type="button"
          onClick={() => onResetToOriginal(layer.id)}
          className="inline-flex items-center gap-1 rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </header>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-[11px] text-muted-foreground">Text</span>
          <textarea
            value={currentText}
            onChange={(e) => onUpdateText(layer.id, e.target.value)}
            rows={4}
            className="w-full rounded border border-border/60 bg-background px-2 py-1.5 text-sm"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">Font family</span>
            <input
              value={layer.styling.fontFamily}
              onChange={(e) => onUpdateStyle(layer.id, { fontFamily: e.target.value })}
              className="w-full rounded border border-border/60 bg-background px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">Font size</span>
            <input
              type="number"
              min={6}
              max={240}
              value={layer.styling.fontSize}
              onChange={(e) => onUpdateStyle(layer.id, { fontSize: Number(e.target.value) || 0 })}
              className="w-full rounded border border-border/60 bg-background px-2 py-1.5 text-sm"
            />
          </label>
        </div>

        <div>
          <span className="mb-1 block text-[11px] text-muted-foreground">Font weight</span>
          <div className="grid grid-cols-5 gap-1">
            {FONT_WEIGHTS.map((weight) => (
              <button
                type="button"
                key={weight}
                onClick={() => onUpdateStyle(layer.id, { fontWeight: weight })}
                className={[
                  "rounded border px-1 py-1 text-[11px]",
                  layer.styling.fontWeight === weight
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-background",
                ].join(" ")}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] text-muted-foreground">Font style</span>
          <select
            value={layer.styling.fontStyle}
            onChange={(e) =>
              onUpdateStyle(layer.id, {
                fontStyle: e.target.value as TextStyling["fontStyle"],
              })
            }
            className="w-full rounded border border-border/60 bg-background px-2 py-1.5 text-sm"
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">Text color</span>
            <input
              type="color"
              value={layer.styling.color}
              onChange={(e) => onUpdateStyle(layer.id, { color: e.target.value })}
              className="h-9 w-full rounded border border-border/60 bg-background"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] text-muted-foreground">Background</span>
            <input
              type="color"
              value={layer.styling.backgroundColor ?? "#ffffff"}
              onChange={(e) => onUpdateStyle(layer.id, { backgroundColor: e.target.value })}
              className="h-9 w-full rounded border border-border/60 bg-background"
            />
            <button
              type="button"
              onClick={() =>
                onUpdateStyle(layer.id, {
                  backgroundColor: layer.styling.backgroundColor ? undefined : "#ffffff",
                })
              }
              className="mt-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {layer.styling.backgroundColor ? "Disable background" : "Enable background"}
            </button>
          </label>
        </div>

        <div>
          <span className="mb-1 block text-[11px] text-muted-foreground">Alignment</span>
          <div className="grid grid-cols-3 gap-1">
            {([
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
            ] as const).map(([align, Icon]) => (
              <button
                key={align}
                type="button"
                onClick={() => onUpdateStyle(layer.id, { textAlign: align })}
                className={[
                  "flex items-center justify-center rounded border px-2 py-1.5",
                  layer.styling.textAlign === align
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/60 bg-background",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] text-muted-foreground">
            Letter spacing ({layer.styling.letterSpacing}px)
          </span>
          <input
            type="range"
            min={-5}
            max={20}
            step={0.5}
            value={layer.styling.letterSpacing}
            onChange={(e) =>
              onUpdateStyle(layer.id, {
                letterSpacing: Number(e.target.value),
              })
            }
            className="w-full"
          />
        </label>
      </div>
    </section>
  );
}
