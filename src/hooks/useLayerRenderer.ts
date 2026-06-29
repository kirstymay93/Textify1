import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Layer } from "@/lib/layerSystem";
import { getLayerDisplayText } from "@/lib/layerSystem";
import { LayerRenderEngine, type RenderableLayer } from "@/lib/renderEngine";

interface UseLayerRendererOptions {
  containerRef: RefObject<HTMLDivElement>;
  layers: Layer[];
  selectedLayerId: number | null;
  onSelectLayer?: (layerId: number | null) => void;
  enabled?: boolean;
}

interface LayerRendererMetrics {
  renderDurationMs: number;
  layerCount: number;
  estimatedFps: number;
}

export function useLayerRenderer({
  containerRef,
  layers,
  selectedLayerId,
  onSelectLayer,
  enabled = true,
}: UseLayerRendererOptions): LayerRendererMetrics {
  const engineRef = useRef<LayerRenderEngine | null>(null);
  const [metrics, setMetrics] = useState<LayerRendererMetrics>({
    renderDurationMs: 0,
    layerCount: 0,
    estimatedFps: 60,
  });

  const renderableLayers = useMemo<RenderableLayer[]>(
    () =>
      layers.map((layer) => ({
        ...layer,
        displayText: getLayerDisplayText(layer),
        isSelected: layer.id === selectedLayerId,
      })),
    [layers, selectedLayerId]
  );

  useEffect(() => {
    if (!containerRef.current || !enabled) return;

    if (!engineRef.current) {
      engineRef.current = new LayerRenderEngine({
        containerElement: containerRef.current,
        enableBatching: true,
        batchTimeMs: 16,
        enableDebugMode: false,
      });
    }

    const start = performance.now();
    engineRef.current.render(renderableLayers, onSelectLayer);
    const renderDurationMs = performance.now() - start;

    setMetrics({
      renderDurationMs,
      layerCount: renderableLayers.length,
      estimatedFps: renderDurationMs > 0 ? Math.min(60, Math.round(1000 / renderDurationMs)) : 60,
    });
  }, [containerRef, enabled, renderableLayers, onSelectLayer]);

  useEffect(() => {
    if (!enabled && engineRef.current) {
      engineRef.current.clear();
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  return metrics;
}
