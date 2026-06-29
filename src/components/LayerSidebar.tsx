import { Eye, EyeOff, Lock, Unlock, Trash2, ChevronUp, ChevronDown } from "lucide-react";
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
            <button
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
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-foreground">Layer {layer.id}</span>
                <div className="flex items-center gap-1">
                  <span
                    className="rounded p-1 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(layer.id, !layer.visible);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </span>
                  <span
                    className="rounded p-1 hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(layer.id, !layer.locked);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {layer.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  </span>
                </div>
              </div>

              <p className="mt-1 truncate text-[11px] text-muted-foreground">{preview}</p>

              <div className="mt-2 flex items-center justify-end gap-1">
                <span
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayerUp(layer.id);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </span>
                <span
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveLayerDown(layer.id);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
                <span
                  className="rounded p-1 text-destructive/80 hover:bg-muted hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.id);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
