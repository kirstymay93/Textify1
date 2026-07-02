import { useState, useCallback, useEffect } from 'react';
import type { Layer, TextStyling, Region } from '@/lib/layerSystem';

export interface UseLayerStateOptions {
  initialRegions: Region[];
  containerWidth: number;
  containerHeight: number;
}

export function useLayerState(options: UseLayerStateOptions) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);

  const selectedLayer = layers.find(l => l.id === selectedLayerId) ?? null;

  const selectLayer = useCallback((id: number) => {
    setSelectedLayerId(id);
  }, []);

  const deselectLayer = useCallback(() => {
    setSelectedLayerId(null);
  }, []);

  const toggleLayer = useCallback((id: number) => {
    setSelectedLayerId(prev => prev === id ? null : id);
  }, []);

  const updateLayerStyle = useCallback((id: number, style: Partial<TextStyling>) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === id
          ? {
              ...layer,
              styling: { ...layer.styling, ...style },
            }
          : layer
      )
    );
  }, []);

  const updateLayerTextContent = useCallback((id: number, text: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === id
          ? {
              ...layer,
              editedText: text,
            }
          : layer
      )
    );
  }, []);

  const initializeFromRegions = useCallback((regions: Region[]) => {
    const newLayers: Layer[] = regions.map((region, index) => ({
      id: index,
      originalText: region.text,
      editedText: region.text,
      confidence: region.confidence ?? 0.95,
      position: {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
        px: region.x * (options.containerWidth / 100),
        py: region.y * (options.containerHeight / 100),
        pw: region.width * (options.containerWidth / 100),
        ph: region.height * (options.containerHeight / 100),
      },
      styling: {
        fontFamily: region.fontFamily ?? 'sans-serif',
        fontSize: region.fontSize ?? 16,
        fontWeight: region.fontWeight ?? '400',
        fontStyle: region.fontStyle ?? 'normal',
        color: region.color ?? '#000000',
        backgroundColor: region.backgroundColor ?? 'transparent',
        letterSpacing: region.letterSpacing ?? 0,
        lineHeight: region.lineHeight ?? 1.2,
        textAlign: (region.textAlign ?? 'left') as 'left' | 'center' | 'right',
      },
      zIndex: index,
      visible: true,
      locked: false,
    }));
    setLayers(newLayers);
  }, [options.containerWidth, options.containerHeight]);

  return {
    layers,
    selectedLayer,
    selectedLayerId,
    selectLayer,
    deselectLayer,
    toggleLayer,
    updateLayerStyle,
    updateLayerTextContent,
    initializeFromRegions,
  };
}
