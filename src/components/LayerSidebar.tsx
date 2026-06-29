import { Eye, EyeOff, Lock, Unlock, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { Layer } from "@/lib/layerSystem";
import { getLayerDisplayText } from "@/lib/layerSystem";

interface LayerSidebarProps {
  layers: Layer[];
  selectedLayerId: number | null;
  onSelectLayer: (id: number) => void;
  onToggleVisibility: (id: number, visible: boolean) => void;
  onToggleLock: (id: number, locked: boolean) => void;
  onMoveLayerUp: (id: number) => void;
  onMoveLayerDown: (id: number) => void;
  onDeleteLayer: (id: number) => void;
}

export function LayerSidebar({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onMoveLayerUp,
  onMoveLayerDown,
  onDeleteLayer,
}: LayerSidebarProps) {
  const orderedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);
  const handleKeyAction = (event: KeyboardEvent<HTMLElement>, action: () => void) => {
    if (event.key === "Enter" || event.key === " ") {
      if (event.currentTarget === document.activeElement) {
        event.preventDefault();
      }
      action();
    }
  };

  return (
    <section className="flex h-full flex-col border-r border-border/60 bg-card/40">
      <header className="border-b border-border/60 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Layers</h2>
        <p className="text-xs text-muted-foreground">{layers.length} total</p>
      </header>

      <div className="flex-1 overflow-y-auto p-2">
        {orderedLayers.map((layer) => {
          const isSelected = layer.id === selectedLayerId;
          const preview = getLayerDisplayText(layer).trim() || "(empty text)";

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={[
                "mb-2 w-full rounded-md border px-2 py-2 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border/60 bg-background/40 hover:bg-muted/60",
              ].join(" ")}
              data-layer-id={layer.id}
              draggable={false}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleKeyAction(e, () => onSelectLayer(layer.id))}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-foreground">Layer {layer.id}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id, !layer.visible);
                    }}
                    onKeyDown={(e) => handleKeyAction(e, () => onToggleVisibility(layer.id, !layer.visible))}
                  >
                    {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(layer.id, !layer.locked);
                    }}
                    onKeyDown={(e) => handleKeyAction(e, () => onToggleLock(layer.id, !layer.locked))}
                  >
                    {layer.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <p className="mt-1 truncate text-[11px] text-muted-foreground">{preview}</p>

              <div className="mt-2 flex items-center justify-end gap-1">
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayerUp(layer.id);
                  }}
                  onKeyDown={(e) => handleKeyAction(e, () => onMoveLayerUp(layer.id))}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayerDown(layer.id);
                  }}
                  onKeyDown={(e) => handleKeyAction(e, () => onMoveLayerDown(layer.id))}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-destructive/80 hover:bg-muted hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  onKeyDown={(e) => handleKeyAction(e, () => onDeleteLayer(layer.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
