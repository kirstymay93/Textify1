import {
  calculatePosition,
  getLayerDisplayText,
  isLayerModified,
  type Layer,
} from "../layerSystem";

const mockLayer: Layer = {
  id: 1,
  originalText: "Original",
  editedText: "Edited",
  confidence: 0.95,
  position: {
    x: 10,
    y: 20,
    width: 50,
    height: 30,
    px: 100,
    py: 200,
    pw: 500,
    ph: 300,
  },
  styling: {
    fontFamily: "Arial",
    fontSize: 16,
    fontWeight: "400",
    fontStyle: "normal",
    color: "#000000",
    backgroundColor: "transparent",
    letterSpacing: 0,
    lineHeight: 1.2,
    textAlign: "left",
  },
  zIndex: 1,
};

describe("layerSystem", () => {
  describe("getLayerDisplayText", () => {
    it("returns edited text when available", () => {
      expect(getLayerDisplayText(mockLayer)).toBe("Edited");
    });

    it("preserves intentionally empty edited text", () => {
      const layer: Layer = {
        ...mockLayer,
        editedText: "",
      };

      expect(getLayerDisplayText(layer)).toBe("");
    });
  });

  describe("isLayerModified", () => {
    it("returns true when text has changed", () => {
      expect(isLayerModified(mockLayer)).toBe(true);
    });

    it("returns false when text matches original", () => {
      const layer: Layer = {
        ...mockLayer,
        editedText: mockLayer.originalText,
      };

      expect(isLayerModified(layer)).toBe(false);
    });
  });

  describe("calculatePosition", () => {
    it("calculates pixel coordinates correctly", () => {
      const position = calculatePosition(
        {
          text: "Test",
          x: 10,
          y: 20,
          width: 50,
          height: 30,
        },
        1000,
        800
      );

      expect(position).toEqual({
        x: 10,
        y: 20,
        width: 50,
        height: 30,
        px: 100,
        py: 160,
        pw: 500,
        ph: 240,
      });
    });
  });
});