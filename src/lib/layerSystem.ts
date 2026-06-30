export interface Region {
  id?: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export interface TextStyling {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  color: string;
  backgroundColor: string;
  letterSpacing: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface Position {
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  px: number; // pixels
  py: number; // pixels
  pw: number; // pixels
  ph: number; // pixels
}

export interface Layer {
  id: number;
  originalText: string;
  editedText: string;
  confidence: number;
  position: Position;
  styling: TextStyling;
  zIndex: number;
  visible: boolean;
  locked: boolean;
}

export function getLayerDisplayText(layer: Layer): string {
  return layer.editedText || layer.originalText;
}

export function isLayerModified(layer: Layer): boolean {
  return layer.editedText !== layer.originalText;
}

export function calculatePosition(
  region: Region,
  containerWidth: number,
  containerHeight: number
): Position {
  return {
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    px: (region.x / 100) * containerWidth,
    py: (region.y / 100) * containerHeight,
    pw: (region.width / 100) * containerWidth,
    ph: (region.height / 100) * containerHeight,
  };
}
