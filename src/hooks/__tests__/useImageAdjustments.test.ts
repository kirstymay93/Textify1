import { renderHook, act } from "@testing-library/react";
import { useImageAdjustments } from "@/hooks/useImageAdjustments";

describe("useImageAdjustments", () => {
  it("initializes with default adjustments", () => {
    const { result } = renderHook(() => useImageAdjustments());

    expect(result.current.adjustments).toEqual({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      highlights: 0,
      shadows: 0,
    });
  });

  it("updates a single adjustment", () => {
    const { result } = renderHook(() => useImageAdjustments());

    act(() => {
      result.current.updateAdjustment("brightness", 50);
    });

    expect(result.current.adjustments.brightness).toBe(50);
  });

  it("resets all adjustments to default", () => {
    const { result } = renderHook(() => useImageAdjustments());

    act(() => {
      result.current.updateAdjustment("brightness", 50);
      result.current.updateAdjustment("contrast", -30);
      result.current.resetAdjustments();
    });

    expect(result.current.adjustments).toEqual({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      warmth: 0,
      highlights: 0,
      shadows: 0,
    });
  });

  it("generates correct filter string for brightness", () => {
    const { result } = renderHook(() => useImageAdjustments());

    act(() => {
      result.current.updateAdjustment("brightness", 50);
    });

    const filterString = result.current.getFilterString();
    expect(filterString).toContain("brightness(150%)");
  });

  it("generates correct filter string for contrast", () => {
    const { result } = renderHook(() => useImageAdjustments());

    act(() => {
      result.current.updateAdjustment("contrast", -30);
    });

    const filterString = result.current.getFilterString();
    expect(filterString).toContain("contrast(70%)");
  });

  it("generates correct filter string for saturation", () => {
    const { result } = renderHook(() => useImageAdjustments());

    act(() => {
      result.current.updateAdjustment("saturation", 25);
    });

    const filterString = result.current.getFilterString();
    expect(filterString).toContain("saturate(125%)");
  });

  it("generates multiple filters in sequence", () => {
    const { result } = renderHook(() => useImageAdjustments());

    act(() => {
      result.current.updateAdjustment("brightness", 20);
      result.current.updateAdjustment("contrast", 10);
      result.current.updateAdjustment("saturation", 15);
    });

    const filterString = result.current.getFilterString();
    expect(filterString).toContain("brightness(120%)");
    expect(filterString).toContain("contrast(110%)");
    expect(filterString).toContain("saturate(115%)");
  });

  it("does not include filters with zero values", () => {
    const { result } = renderHook(() => useImageAdjustments());

    act(() => {
      result.current.updateAdjustment("brightness", 0);
    });

    const filterString = result.current.getFilterString();
    expect(filterString).not.toContain("brightness");
  });

  it("handles warmth adjustment correctly", () => {
    const { result } = renderHook(() => useImageAdjustments());

    act(() => {
      result.current.updateAdjustment("warmth", 20);
    });

    const filterString = result.current.getFilterString();
    expect(filterString).toContain("hue-rotate(24deg)");
  });

  it("handles negative warmth adjustment", () => {
    const { result } = renderHook(() => useImageAdjustments());

    act(() => {
      result.current.updateAdjustment("warmth", -20);
    });

    const filterString = result.current.getFilterString();
    expect(filterString).toContain("hue-rotate(-24deg)");
  });
});
