import {
  getLayerDisplayText,
  isLayerModified,
  calculatePosition,
  type Layer,
} from '../layerSystem';

const mockLayer: Layer = {
  id: 1,
  originalText: 'Original',
  editedText: 'Edited',
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
    fontFamily: 'Arial',
    fontSize: 16,
    fontWeight: '400',
    fontStyle: 'normal',
    color: '#000000',
    backgroundColor: 'transparent',
    letterSpacing: 0,
    lineHeight: 1.2,
    textAlign: 'left',
  },
  zIndex: 1,
};

describe('layerSystem', () => {
  describe('getLayerDisplayText', () => {
    it('returns edited text when available', () => {
      expect(getLayerDisplayText(mockLayer)).toBe('Edited');
    });

    it('falls back to original text when edited text is empty', () => {
      const layer = { ...mockLayer, editedText: '' };
      expect(getLayerDisplayText(layer)).toBe('');
    });
  });

  describe('isLayerModified', () => {
    it('returns true when text is edited', () => {
      expect(isLayerModified(mockLayer)).toBe(true);
    });

    it('returns false when text is not edited', () => {
      const layer = { ...mockLayer, editedText: mockLayer.originalText };
      expect(isLayerModified(layer)).toBe(false);
    });
  });

  describe('calculatePosition', () => {
    it('calculates correct pixel position', () => {
      const position = calculatePosition(
        {
          text: 'Test',
          x: 10,
          y: 20,
          width: 50,
          height: 30,
        },
        1000,
        800
      );
      expect(position.px).toBe(100);
      expect(position.py).toBe(160);
      expect(position.pw).toBe(500);
      expect(position.ph).toBe(240);
    });
  });
});
