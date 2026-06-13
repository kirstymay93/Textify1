import type { TextRegion } from "../../../drizzle/schema";

/**
 * ══════════════════════════════════════════════════════════════════════════════
 * LAYER SYSTEM - Modern Architecture
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * This module provides a layer-based system that wraps the existing region system.
 * Each layer represents a text element with full control over positioning, sizing,
 * and styling. The system preserves pixel coordinates exactly and maintains
 * backward compatibility with the current region-based workflow.
 * 
 * Features:
 * - Layer state management
 * - Pixel coordinate preservation
 * - Gradient migration from regions to layers
 * - Full styling support
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * TextStyling - Complete text appearance control
 */
export interface TextStyling {
  fontFamily: string;
  fontSize: number; // in pixels
  fontWeight: "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
  fontStyle: "normal" | "italic";
  color: string; // hex color
  backgroundColor?: string;
  letterSpacing: number; // in pixels
  lineHeight?: number;
  textAlign: "left" | "center" | "right";
}

/**
 * PositionData - Exact pixel and percentage coordinates
 */
export interface PositionData {
  /** Percentage position (0-100) */
  x: number;
  y: number;
  /** Percentage size (0-100) */
  width: number;
  height: number;
  /** Computed pixel coordinates (calculated from container size) */
  px: number;
  py: number;
  pw: number;
  ph: number;
}

/**
 * Layer - Main layer object representing a text element
 */
export interface Layer {
  id: number; // Unique identifier
  type: "text"; // Future-proofing for other layer types
  
  // Text content
  originalText: string;
  editedText?: string; // User-modified text
  
  // Position & Size
  position: PositionData;
  
  // Styling
  styling: TextStyling;
  
  // Metadata
  confidence?: number; // Detection confidence (0-1)
  visible: boolean;
  locked: boolean;
  zIndex: number; // Layer stacking order
  
  // Backend sync
  isSynced: boolean;
  lastSyncedAt?: Date;
}

/**
 * LayerState - Central state for all layers
 */
export interface LayerState {
  layers: Layer[];
  selectedLayerId: number | null;
  containerWidth: number; // Canvas/image width
  containerHeight: number; // Canvas/image height
}

// ─── Layer Factory ──────────────────────────────────────────────────────────

/**
 * Creates a new layer from a TextRegion
 * This is the primary migration path from regions → layers
 */
export function createLayerFromRegion(
  region: TextRegion & { px?: number; py?: number; pw?: number; ph?: number },
  containerWidth: number,
  containerHeight: number
): Layer {
  return {
    id: region.id,
    type: "text",
    originalText: region.originalText ?? "",
    editedText: region.editedText,
    position: {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
      px: region.px ?? (region.x / 100) * containerWidth,
      py: region.py ?? (region.y / 100) * containerHeight,
      pw: region.pw ?? (region.width / 100) * containerWidth,
      ph: region.ph ?? (region.height / 100) * containerHeight,
    },
    styling: {
      fontFamily: region.fontFamily ?? "sans-serif",
      fontSize: region.fontSize ?? 16,
      fontWeight: (region.fontWeight ?? "400") as any,
      fontStyle: (region.fontStyle ?? "normal") as any,
      color: region.color ?? "#000000",
      backgroundColor: region.backgroundColor,
      letterSpacing: region.letterSpacing ?? 0,
      lineHeight: region.lineHeight,
      textAlign: (region.textAlign ?? "left") as any,
    },
    confidence: region.confidence,
    visible: true,
    locked: false,
    zIndex: region.id,
    isSynced: true,
  };
}

/**
 * Converts a Layer back to TextRegion format for API calls
 */
export function layerToRegion(layer: Layer): Partial<TextRegion> {
  return {
    id: layer.id,
    originalText: layer.originalText,
    editedText: layer.editedText,
    x: layer.position.x,
    y: layer.position.y,
    width: layer.position.width,
    height: layer.position.height,
    fontFamily: layer.styling.fontFamily,
    fontSize: layer.styling.fontSize,
    fontWeight: layer.styling.fontWeight,
    fontStyle: layer.styling.fontStyle,
    color: layer.styling.color,
    backgroundColor: layer.styling.backgroundColor,
    letterSpacing: layer.styling.letterSpacing,
    lineHeight: layer.styling.lineHeight,
    textAlign: layer.styling.textAlign,
  };
}

// ─── Layer State Management ─────────────────────────────────────────────────

/**
 * Updates pixel coordinates when container size changes
 * Preserves percentage coordinates exactly
 */
export function recalculateLayerPixelCoords(
  layer: Layer,
  newContainerWidth: number,
  newContainerHeight: number
): Layer {
  return {
    ...layer,
    position: {
      ...layer.position,
      px: (layer.position.x / 100) * newContainerWidth,
      py: (layer.position.y / 100) * newContainerHeight,
      pw: (layer.position.width / 100) * newContainerWidth,
      ph: (layer.position.height / 100) * newContainerHeight,
    },
  };
}

/**
 * Recalculates all layer pixel coordinates
 */
export function recalculateAllPixelCoords(
  layers: Layer[],
  newContainerWidth: number,
  newContainerHeight: number
): Layer[] {
  return layers.map((layer) =>
    recalculateLayerPixelCoords(layer, newContainerWidth, newContainerHeight)
  );
}

/**
 * Updates a layer's styling
 */
export function updateLayerStyling(
  layer: Layer,
  stylingUpdates: Partial<TextStyling>
): Layer {
  return {
    ...layer,
    styling: {
      ...layer.styling,
      ...stylingUpdates,
    },
    isSynced: false,
  };
}

/**
 * Updates a layer's text content
 */
export function updateLayerText(
  layer: Layer,
  editedText: string
): Layer {
  return {
    ...layer,
    editedText: editedText || undefined,
    isSynced: false,
  };
}

/**
 * Updates layer position (percentage-based)
 */
export function updateLayerPosition(
  layer: Layer,
  x: number,
  y: number,
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number
): Layer {
  return {
    ...layer,
    position: {
      x,
      y,
      width,
      height,
      px: (x / 100) * containerWidth,
      py: (y / 100) * containerHeight,
      pw: (width / 100) * containerWidth,
      ph: (height / 100) * containerHeight,
    },
    isSynced: false,
  };
}

/**
 * Marks a layer as synced with backend
 */
export function markLayerAsSynced(layer: Layer): Layer {
  return {
    ...layer,
    isSynced: true,
    lastSyncedAt: new Date(),
  };
}

// ─── Layer List Operations ──────────────────────────────────────────────────

/**
 * Updates a layer in the layers array
 */
export function updateLayerInList(
  layers: Layer[],
  layerId: number,
  updates: Partial<Layer>
): Layer[] {
  return layers.map((layer) =>
    layer.id === layerId ? { ...layer, ...updates } : layer
  );
}

/**
 * Removes a layer from the array
 */
export function removeLayerFromList(
  layers: Layer[],
  layerId: number
): Layer[] {
  return layers.filter((layer) => layer.id !== layerId);
}

/**
 * Gets a layer by ID
 */
export function getLayerById(
  layers: Layer[],
  layerId: number
): Layer | undefined {
  return layers.find((layer) => layer.id === layerId);
}

/**
 * Reorders layers (z-index management)
 */
export function reorderLayers(
  layers: Layer[],
  sourceIndex: number,
  targetIndex: number
): Layer[] {
  const newLayers = [...layers];
  const [movedLayer] = newLayers.splice(sourceIndex, 1);
  newLayers.splice(targetIndex, 0, movedLayer);
  
  // Update z-indices
  return newLayers.map((layer, index) => ({
    ...layer,
    zIndex: index,
  }));
}

// ─── Utility Functions ──────────────────────────────────────────────────────

/**
 * Gets the display text for a layer (edited or original)
 */
export function getLayerDisplayText(layer: Layer): string {
  return layer.editedText ?? layer.originalText ?? "";
}

/**
 * Checks if a layer has been modified
 */
export function isLayerModified(layer: Layer): boolean {
  return layer.editedText !== undefined && layer.editedText !== layer.originalText;
}

/**
 * Filters unsynced layers
 */
export function getUnsyncedLayers(layers: Layer[]): Layer[] {
  return layers.filter((layer) => !layer.isSynced);
}

/**
 * Calculates total bounds of all layers
 */
export function calculateLayersBounds(
  layers: Layer[]
): { minX: number; minY: number; maxX: number; maxY: number } {
  if (layers.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const layer of layers) {
    const { x, y, width, height } = layer.position;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  return { minX, minY, maxX, maxY };
}
