import { memo, useState } from "react";
import { Sliders, Zap, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ImageAdjustmentsState {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  highlights: number;
  shadows: number;
}

interface ImageAdjustmentsProps {
  adjustments: ImageAdjustmentsState;
  onAdjustmentChange: (key: keyof ImageAdjustmentsState, value: number) => void;
  onReset: () => void;
}

const ADJUSTMENT_RANGES = {
  brightness: { min: -100, max: 100, label: "Brightness" },
  contrast: { min: -100, max: 100, label: "Contrast" },
  saturation: { min: -100, max: 100, label: "Saturation" },
  warmth: { min: -50, max: 50, label: "Warmth" },
  highlights: { min: -100, max: 100, label: "Highlights" },
  shadows: { min: -100, max: 100, label: "Shadows" },
};

export const ImageAdjustments = memo(function ImageAdjustments({
  adjustments,
  onAdjustmentChange,
  onReset,
}: ImageAdjustmentsProps) {
  const [activeTab, setActiveTab] = useState<"tune" | "filters">("tune");

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Adjustments</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Reset
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-border">
        <button
          onClick={() => setActiveTab("tune")}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors",
            activeTab === "tune"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sliders className="w-3 h-3" />
          Tune
        </button>
        <button
          onClick={() => setActiveTab("filters")}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors",
            activeTab === "filters"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Palette className="w-3 h-3" />
          Filters
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "tune" && (
          <div className="space-y-4">
            {(Object.keys(ADJUSTMENT_RANGES) as Array<keyof typeof ADJUSTMENT_RANGES>).map(
              (key) => {
                const range = ADJUSTMENT_RANGES[key];
                const value = adjustments[key];

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-foreground">
                        {range.label}
                      </label>
                      <span className="text-xs text-muted-foreground">{value}</span>
                    </div>
                    <input
                      type="range"
                      min={range.min}
                      max={range.max}
                      value={value}
                      onChange={(e) =>
                        onAdjustmentChange(key, parseInt(e.target.value, 10))
                      }
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-foreground"
                    />
                  </div>
                );
              }
            )}
          </div>
        )}

        {activeTab === "filters" && (
          <div className="space-y-2">
            {["Warm", "Cool", "Vintage", "Vibrant", "Grayscale", "Sepia"].map(
              (filter) => (
                <button
                  key={filter}
                  className="w-full px-3 py-2 rounded text-sm text-foreground bg-muted hover:bg-muted/80 transition-colors text-left flex items-center gap-2"
                >
                  <Sparkles className="w-3 h-3 text-muted-foreground" />
                  {filter}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
});

ImageAdjustments.displayName = "ImageAdjustments";
