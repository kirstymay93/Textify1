import { useState, useCallback, useEffect } from "react";
import type { Layer, LayerState, TextStyling, PositionData } from "@/lib/layerSystem";
import {
  createLayerFromRegion,
  recalculateAllPixelCoords,
  updateLayerStyling,
  updateLayerText,
  updateLayerPosition,
  markLayerAsSynced,
  updateLayerInList,
  removeLayerFromList,
  reorderLayers,
} from "@/lib/layerSystem";
import type { TextRegion } from "../../drizzle/schema";

/**
 * ═══════════════════════════════════════════════════════════════════════════════════
 * useLayerState Hook
 * ═══════════════════════════════════════════════════════════════════════════════════
 * 
 * Custom hook for managing the layer system state.
 * Provides a clean API for layer operations while maintaining
 * backward compatibility with the existing region-based system.
 * 
 * Usage in components:
 * const layers = useLayerState(rawRegions, containerWidth, containerHeight);
 */

interface UseLayerStateOptions {
  initialRegions?: (TextRegion & { px?: number; py?: number; pw?: number; ph?: number })[];
  containerWidth: number;
  containerHeight: number;
}

interface UseLayerStateReturn {
  // State
  layers: Layer[];
  selectedLayerId: number | null;
  containerWidth: number;
  containerHeight: number;

  // Layer queries
  selectedLayer: Layer | null;
  getLayer: (id: number) => Layer | undefined;

  // Selection
  selectLayer: (id: number) => void;
  deselectLayer: () => void;
  toggleLayer: (id: number) => void;

  // Updates
  updateLayerStyle: (id: number, updates: Partial<TextStyling>) => void;
  updateLayerTextContent: (id: number, text: string) => void;
  updateLayerPos: (id: number, x: number, y: number, w: number, h: number) => void;
  updateLayerVisibility: (id: number, visible: boolean) => void;
  updateLayerLock: (id: number, locked: boolean) => void;

  // Layer management
  removeLayer: (id: number) => void;
  moveLayerUp: (id: number) => void;
  moveLayerDown: (id: number) => void;

  // Sync
  markLayerSynced: (id: number) => void;

  // Container
  updateContainerSize: (width: number, height: number) => void;

  // Batch operations
  initializeFromRegions: (regions: (TextRegion & { px?: number; py?: number; pw?: number; ph?: number })[]) => void;
}

export function useLayerState({
  initialRegions = [],
  containerWidth,
  containerHeight,
}: UseLayerStateOptions): UseLayerStateReturn {
  // ═══════════════════════════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════════════════════════
  const [layers, setLayers] = useState<Layer[]>(() => {
    return initialRegions.map((region) =>
      createLayerFromRegion(region, containerWidth, containerHeight)
    );
  });

  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
  const [currentContainerWidth, setCurrentContainerWidth] = useState(containerWidth);
  const [currentContainerHeight, setCurrentContainerHeight] = useState(containerHeight);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // Queries
  // ═══════════════════════════════════════════════════════════════════════════════════
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  const getLayer = useCallback(
    (id: number) => layers.find((l) => l.id === id),
    [layers]
  );

  // ═══════════════════════════════════════════════════════════════════════════════════
  // Selection
  // ═══════════════════════════════════════════════════════════════════════════════════
  const selectLayer = useCallback((id: number) => {
    setSelectedLayerId(id);
  }, []);

  const deselectLayer = useCallback(() => {
    setSelectedLayerId(null);
  }, []);

  const toggleLayer = useCallback((id: number) => {
    setSelectedLayerId((prev) => (prev === id ? null : id));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // Updates
  // ═══════════════════════════════════════════════════════════════════════════════════
  const updateLayerStyle = useCallback(
    (id: number, updates: Partial<TextStyling>) => {
      setLayers((prev) => {
        const layer = prev.find((l) => l.id === id);
        if (!layer) return prev;
        return updateLayerInList(
          prev,
          id,
          updateLayerStyling(layer, updates)
        );
      });
    },
    []
  );

  const updateLayerTextContent = useCallback(
    (id: number, text: string) => {
      setLayers((prev) => {
        const layer = prev.find((l) => l.id === id);
        if (!layer) return prev;
        return updateLayerInList(
          prev,
          id,
          updateLayerText(layer, text)
        );
      });
    },
    []
  );

  const updateLayerPos = useCallback(
    (id: number, x: number, y: number, w: number, h: number) => {
      setLayers((prev) => {
        const layer = prev.find((l) => l.id === id);
        if (!layer) return prev;
        return updateLayerInList(
          prev,
          id,
          updateLayerPosition(layer, x, y, w, h, currentContainerWidth, currentContainerHeight)
        );
      });
    },
    [currentContainerWidth, currentContainerHeight]
  );

  const updateLayerVisibility = useCallback((id: number, visible: boolean) => {
    setLayers((prev) => updateLayerInList(prev, id, { visible }));
  }, []);

  const updateLayerLock = useCallback((id: number, locked: boolean) => {
    setLayers((prev) => updateLayerInList(prev, id, { locked }));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // Layer Management
  // ═══════════════════════════════════════════════════════════════════════════════════
  const removeLayer = useCallback((id: number) => {
    setLayers((prev) => removeLayerFromList(prev, id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  }, [selectedLayerId]);

  const moveLayerUp = useCallback((id: number) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index < prev.length - 1) {
        return reorderLayers(prev, index, index + 1);
      }
      return prev;
    });
  }, []);

  const moveLayerDown = useCallback((id: number) => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index > 0) {
        return reorderLayers(prev, index, index - 1);
      }
      return prev;
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // Sync
  // ═══════════════════════════════════════════════════════════════════════════════════
  const markLayerSynced = useCallback((id: number) => {
    setLayers((prev) => {
      const layer = prev.find((l) => l.id === id);
      if (!layer) return prev;
      return updateLayerInList(prev, id, markLayerAsSynced(layer));
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // Container Size
  // ═══════════════════════════════════════════════════════════════════════════════════
  const updateContainerSize = useCallback((width: number, height: number) => {
    setCurrentContainerWidth(width);
    setCurrentContainerHeight(height);
    // Recalculate all pixel coordinates
    setLayers((prev) => recalculateAllPixelCoords(prev, width, height));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // Batch Operations
  // ═══════════════════════════════════════════════════════════════════════════════════
  const initializeFromRegions = useCallback(
    (regions: (TextRegion & { px?: number; py?: number; pw?: number; ph?: number })[]) => {
      const newLayers = regions.map((region) =>
        createLayerFromRegion(region, currentContainerWidth, currentContainerHeight)
      );
      setLayers(newLayers);
      setSelectedLayerId(null);
    },
    [currentContainerWidth, currentContainerHeight]
  );

  // ═══════════════════════════════════════════════════════════════════════════════════
  // Effects
  // ═══════════════════════════════════════════════════════════════════════════════════
  // Sync container size updates from props
  useEffect(() => {
    if (containerWidth !== currentContainerWidth || containerHeight !== currentContainerHeight) {
      updateContainerSize(containerWidth, containerHeight);
    }
  }, [containerWidth, containerHeight, currentContainerWidth, currentContainerHeight, updateContainerSize]);

  // ═══════════════════════════════════════════════════════════════════════════════════
  // Return API
  // ═══════════════════════════════════════════════════════════════════════════════════
  return {
    layers,
    selectedLayerId,
    containerWidth: currentContainerWidth,
    containerHeight: currentContainerHeight,
    selectedLayer,
    getLayer,
    selectLayer,
    deselectLayer,
    toggleLayer,
    updateLayerStyle,
    updateLayerTextContent,
    updateLayerPos,
    updateLayerVisibility,
    updateLayerLock,
    removeLayer,
    moveLayerUp,
    moveLayerDown,
    markLayerSynced,
    updateContainerSize,
    initializeFromRegions,
  };
}
