import { useState, useCallback } from "react";
import type { ImageAdjustmentsState } from "@/components/ImageAdjustments";

const DEFAULT_ADJUSTMENTS: ImageAdjustmentsState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  highlights: 0,
  shadows: 0,
};

export function useImageAdjustments() {
  const [adjustments, setAdjustments] = useState<ImageAdjustmentsState>(DEFAULT_ADJUSTMENTS);

  const updateAdjustment = useCallback(
    (key: keyof ImageAdjustmentsState, value: number) => {
      setAdjustments((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const resetAdjustments = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
  }, []);

  const getFilterString = useCallback(() => {
    const filters: string[] = [];

    if (adjustments.brightness !== 0) {
      filters.push(`brightness(${100 + adjustments.brightness}%)`);
    }
    if (adjustments.contrast !== 0) {
      filters.push(`contrast(${100 + adjustments.contrast}%)`);
    }
    if (adjustments.saturation !== 0) {
      filters.push(`saturate(${100 + adjustments.saturation}%)`);
    }
    if (adjustments.warmth !== 0) {
      const hueRotate = adjustments.warmth * 1.2;
      filters.push(`hue-rotate(${hueRotate}deg)`);
    }
    if (adjustments.highlights !== 0) {
      filters.push(`brightness(${100 + adjustments.highlights * 0.3}%)`);
    }
    if (adjustments.shadows !== 0) {
      filters.push(`contrast(${100 + adjustments.shadows * 0.3}%)`);
    }

    return filters.join(" ");
  }, [adjustments]);

  return {
    adjustments,
    updateAdjustment,
    resetAdjustments,
    getFilterString,
  };
}
