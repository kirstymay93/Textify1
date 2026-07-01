/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DOM RENDERING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * High-performance DOM-based rendering engine for layers.
 * Each layer is rendered as an absolutely positioned DOM element with
 * z-index stacking, prepared for drag-and-drop interactions.
 * 
 * Architecture:
 * - LayerRenderEngine: Core rendering orchestration
 * - LayerDOMNode: Individual layer DOM representation
 * - RenderOptimizer: Performance optimization for 100+ layers
 * - RenderCache: Memoization and diff detection
 */

import type { Layer } from "@/lib/layerSystem";

// ─── Core Types ───────────────────────────────────────────────────────────────

/**
 * RenderableLayer - Layer data prepared for DOM rendering
 */
export interface RenderableLayer extends Layer {
  // Computed rendering properties
  displayText: string;
  isSelected: boolean;
  isDragging?: boolean;
  isHovered?: boolean;
  visible?: boolean;
  locked?: boolean;
}

/**
 * LayerDOMElement - Reference to rendered DOM node
 */
export interface LayerDOMElement {
  layerId: number;
  element: HTMLDivElement;
  textElement?: HTMLDivElement; // Nested text content
  updateScheduled?: boolean;
}

/**
 * RenderCache - Stores previous render state for diff detection
 */
export interface RenderCache {
  layerId: number;
  layer: RenderableLayer;
  hash: string;
  element?: HTMLDivElement;
}

/**
 * RenderEngineConfig - Configuration for the rendering engine
 */
export interface RenderEngineConfig {
  containerElement: HTMLDivElement;
  enableBatching?: boolean;
  batchTimeMs?: number;
  enableVirtualization?: boolean; // For 1000+ layers
  enableDebugMode?: boolean;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Generates a hash of layer properties for change detection
 * Used to avoid unnecessary DOM updates
 */
export function hashLayer(layer: RenderableLayer): string {
  const parts = [
    layer.id,
    layer.position.px,
    layer.position.py,
    layer.position.pw,
    layer.position.ph,
    layer.styling.color,
    layer.styling.fontSize,
    layer.styling.fontFamily,
    layer.displayText,
    layer.visible,
    layer.isSelected,
    layer.zIndex,
  ];
  return parts.join("|");
}

/**
 * Checks if a layer has changed by comparing hashes
 */
export function hasLayerChanged(
  oldHash: string,
  newLayer: RenderableLayer
): boolean {
  return oldHash !== hashLayer(newLayer);
}

/**
 * Creates CSS transform style for layer positioning
 */
export function getLayerTransformStyle(layer: RenderableLayer): React.CSSProperties {
  return {
    position: "absolute",
    left: layer.position.px,
    top: layer.position.py,
    width: layer.position.pw,
    height: layer.position.ph,
    zIndex: layer.zIndex,
    opacity: layer.visible ? 1 : 0,
    pointerEvents: layer.locked ? "none" : "auto",
  };
}

/**
 * Creates CSS style for text content within a layer
 */
export function getLayerTextStyle(layer: RenderableLayer): React.CSSProperties {
  return {
    fontFamily: `"${layer.styling.fontFamily}", sans-serif`,
    fontSize: layer.styling.fontSize,
    fontWeight: layer.styling.fontWeight,
    fontStyle: layer.styling.fontStyle,
    color: layer.styling.color,
    textAlign: layer.styling.textAlign as any,
    letterSpacing: layer.styling.letterSpacing,
    lineHeight: layer.styling.lineHeight ?? "normal",
    backgroundColor: layer.styling.backgroundColor,
    padding: "2px 4px",
    overflow: "hidden",
    whiteSpace: "normal",
    wordWrap: "break-word",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    height: "100%",
    width: "100%",
  };
}

// ─── DOM Manipulation ────────────────────────────────────────────────────

/**
 * Creates a DOM element for a layer
 */
export function createLayerElement(
  layer: RenderableLayer,
  onSelect?: (id: number) => void
): HTMLDivElement {
  const element = document.createElement("div");
  element.dataset.layerId = String(layer.id);
  element.className = `layer-element ${layer.isSelected ? "selected" : ""}${
    layer.isDragging ? "dragging" : ""
  }`;

  // Apply positioning and styling
  const styles = getLayerTransformStyle(layer);
  Object.assign(element.style, styles);

  // Add border for selected layers
  if (layer.isSelected) {
    element.style.border = "2px solid #007bff";
    element.style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
  } else {
    element.style.border = "1px solid rgba(0, 123, 255, 0.3)";
  }

  // Create text content element
  const textElement = document.createElement("div");
  textElement.className = "layer-text";
  const textStyles = getLayerTextStyle(layer);
  Object.assign(textElement.style, textStyles);
  textElement.textContent = layer.displayText;

  element.appendChild(textElement);

  // Add click handler for selection
  if (onSelect) {
    element.addEventListener("click", (e) => {
      e.stopPropagation();
      onSelect(layer.id);
    });
  }

  // Add cursor for dragging (future feature)
  element.style.cursor = layer.locked ? "default" : "move";

  return element;
}

/**
 * Updates an existing layer DOM element
 */
export function updateLayerElement(
  element: HTMLDivElement,
  layer: RenderableLayer
): void {
  // Update position and sizing
  const styles = getLayerTransformStyle(layer);
  Object.assign(element.style, styles);

  // Update border styling
  if (layer.isSelected) {
    element.style.border = "2px solid #007bff";
    element.style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
    element.classList.add("selected");
  } else {
    element.style.border = "1px solid rgba(0, 123, 255, 0.3)";
    element.style.boxShadow = "none";
    element.classList.remove("selected");
  }

  // Update cursor
  element.style.cursor = layer.locked ? "default" : "move";

  // Update text content
  const textElement = element.querySelector(".layer-text") as HTMLDivElement;
  if (textElement) {
    const textStyles = getLayerTextStyle(layer);
    Object.assign(textElement.style, textStyles);
    textElement.textContent = layer.displayText;
  }

  // Update drag state
  if (layer.isDragging) {
    element.classList.add("dragging");
    element.style.opacity = "0.8";
  } else {
    element.classList.remove("dragging");
    element.style.opacity = layer.visible ? "1" : "0";
  }
}

// ─── Batch Rendering ────────────────────────────────────────────────────

/**
 * RenderBatcher - Batches DOM updates for performance
 */
export class RenderBatcher {
  private pendingUpdates: Map<number, RenderableLayer> = new Map();
  private batchTimer?: NodeJS.Timeout;
  private batchTimeMs: number = 16; // ~60fps
  private onFlush: (layers: RenderableLayer[]) => void;

  constructor(
    onFlush: (layers: RenderableLayer[]) => void,
    batchTimeMs: number = 16
  ) {
    this.onFlush = onFlush;
    this.batchTimeMs = batchTimeMs;
  }

  /**
   * Schedule a layer update
   */
  scheduleUpdate(layer: RenderableLayer): void {
    this.pendingUpdates.set(layer.id, layer);
    this.scheduleBatch();
  }

  /**
   * Batch multiple layer updates
   */
  scheduleBatchUpdate(layers: RenderableLayer[]): void {
    for (const layer of layers) {
      this.pendingUpdates.set(layer.id, layer);
    }
    this.scheduleBatch();
  }

  /**
   * Immediately flush pending updates
   */
  flush(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }
    if (this.pendingUpdates.size > 0) {
      const layers = Array.from(this.pendingUpdates.values());
      this.pendingUpdates.clear();
      this.onFlush(layers);
    }
  }

  /**
   * Schedule a batch flush
   */
  private scheduleBatch(): void {
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flush();
      }, this.batchTimeMs);
    }
  }

  /**
   * Clear pending updates
   */
  clear(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }
    this.pendingUpdates.clear();
  }
}

// ─── Render Cache ──────────────────────────────────────────────────────────

/**
 * RenderCache - Tracks rendered layers and their state
 */
export class RenderCacheManager {
  private cache: Map<number, RenderCache> = new Map();
  private domElements: Map<number, HTMLDivElement> = new Map();

  /**
   * Check if layer needs re-render
   */
  needsUpdate(layer: RenderableLayer): boolean {
    const cached = this.cache.get(layer.id);
    if (!cached) return true;
    return hasLayerChanged(cached.hash, layer);
  }

  /**
   * Store rendered layer in cache
   */
  cacheLayer(layer: RenderableLayer, element: HTMLDivElement): void {
    this.cache.set(layer.id, {
      layerId: layer.id,
      layer,
      hash: hashLayer(layer),
      element,
    });
    this.domElements.set(layer.id, element);
  }

  /**
   * Get cached DOM element
   */
  getElement(layerId: number): HTMLDivElement | undefined {
    return this.domElements.get(layerId);
  }

  /**
   * Get all cached elements
   */
  getAllElements(): HTMLDivElement[] {
    return Array.from(this.domElements.values());
  }

  /**
   * Remove from cache (layer deleted)
   */
  removeLayer(layerId: number): void {
    this.cache.delete(layerId);
    const element = this.domElements.get(layerId);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    this.domElements.delete(layerId);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.domElements.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.domElements.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// ─── Main Rendering Engine ────────────────────────────────────────────────

/**
 * LayerRenderEngine - High-performance DOM rendering for layers
 */
export class LayerRenderEngine {
  private container: HTMLDivElement;
  private cache: RenderCacheManager;
  private batcher: RenderBatcher;
  private selectedLayerId: number | null = null;
  private onSelectionChange?: (layerId: number | null) => void;
  private enableDebug: boolean = false;
  private renderCount: number = 0;

  constructor(config: RenderEngineConfig) {
    this.container = config.containerElement;
    this.enableDebug = config.enableDebugMode ?? false;
    this.cache = new RenderCacheManager();
    this.batcher = new RenderBatcher(
      (layers) => this.flushRender(layers),
      config.batchTimeMs ?? 16
    );

    // Set container as positioning context
    this.container.style.position = "relative";
  }

  /**
   * Render layers to DOM
   */
  render(
    layers: RenderableLayer[],
    onSelectionChange?: (layerId: number | null) => void
  ): void {
    this.onSelectionChange = onSelectionChange;

    if (this.enableDebug) {
      console.time(`Layer Render (${layers.length} layers)`);
    }

    // Sort layers by z-index
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    // Identify layers to add, update, or remove
    const existingIds = new Set(this.cache.getAllElements().map((el) => Number(el.dataset.layerId)));
    const incomingIds = new Set(sortedLayers.map((l) => l.id));

    // Remove deleted layers
    for (const id of existingIds) {
      if (!incomingIds.has(id)) {
        this.cache.removeLayer(id);
      }
    }

    // Add or update layers
    for (const layer of sortedLayers) {
      const existingElement = this.cache.getElement(layer.id);

      // Update selection state
      const renderableLayer = {
        ...layer,
        isSelected: layer.id === this.selectedLayerId,
      };

      if (existingElement && !this.cache.needsUpdate(renderableLayer)) {
        // Layer unchanged, skip
        continue;
      }

      if (existingElement) {
        // Update existing element
        updateLayerElement(existingElement, renderableLayer);
      } else {
        // Create new element
        const newElement = createLayerElement(
          renderableLayer,
          (id) => this.selectLayer(id)
        );
        this.container.appendChild(newElement);
        this.cache.cacheLayer(renderableLayer, newElement);
      }

      this.cache.cacheLayer(renderableLayer, existingElement || this.cache.getElement(layer.id)!);
    }

    this.renderCount++;
    if (this.enableDebug) {
      console.timeEnd(`Layer Render (${layers.length} layers)`);
      console.log(`Render #${this.renderCount}: ${this.cache.size()} cached elements`);
    }
  }

  /**
   * Batch update layers
   */
  scheduleUpdate(layer: RenderableLayer): void {
    this.batcher.scheduleUpdate(layer);
  }

  /**
   * Batch update multiple layers
   */
  scheduleBatchUpdate(layers: RenderableLayer[]): void {
    this.batcher.scheduleBatchUpdate(layers);
  }

  /**
   * Flush pending batch updates
   */
  private flushRender(layers: RenderableLayer[]): void {
    if (this.enableDebug) {
      console.time(`Batch Flush (${layers.length} layers)`);
    }

    for (const layer of layers) {
      const element = this.cache.getElement(layer.id);
      if (element) {
        const renderableLayer = {
          ...layer,
          isSelected: layer.id === this.selectedLayerId,
        };
        updateLayerElement(element, renderableLayer);
        this.cache.cacheLayer(renderableLayer, element);
      }
    }

    if (this.enableDebug) {
      console.timeEnd(`Batch Flush (${layers.length} layers)`);
    }
  }

  /**
   * Select a layer
   */
  selectLayer(layerId: number): void {
    if (this.selectedLayerId === layerId) return;

    // Deselect previous
    if (this.selectedLayerId !== null) {
      const prevElement = this.cache.getElement(this.selectedLayerId);
      if (prevElement) {
        prevElement.classList.remove("selected");
        prevElement.style.border = "1px solid rgba(0, 123, 255, 0.3)";
        prevElement.style.boxShadow = "none";
      }
    }

    // Select new
    this.selectedLayerId = layerId;
    const newElement = this.cache.getElement(layerId);
    if (newElement) {
      newElement.classList.add("selected");
      newElement.style.border = "2px solid #007bff";
      newElement.style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
    }

    this.onSelectionChange?.(layerId);
  }

  /**
   * Deselect current layer
   */
  deselectLayer(): void {
    if (this.selectedLayerId !== null) {
      const element = this.cache.getElement(this.selectedLayerId);
      if (element) {
        element.classList.remove("selected");
        element.style.border = "1px solid rgba(0, 123, 255, 0.3)";
        element.style.boxShadow = "none";
      }
      this.selectedLayerId = null;
      this.onSelectionChange?.(null);
    }
  }

  /**
   * Get element by layer ID (useful for drag operations)
   */
  getElement(layerId: number): HTMLDivElement | undefined {
    return this.cache.getElement(layerId);
  }

  /**
   * Clear all rendered layers
   */
  clear(): void {
    this.batcher.clear();
    this.cache.clear();
    this.selectedLayerId = null;
  }

  /**
   * Destroy engine
   */
  destroy(): void {
    this.clear();
    this.container.innerHTML = "";
  }
}
