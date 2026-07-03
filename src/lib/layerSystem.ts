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
  textAlign?: "left" | "center" | "right";
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
  textAlign: "left" | "center" | "right";
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
  px: number;
  py: number;
  pw: number;
  ph: number;
}

export interface Layer {
  id: number;
  originalText: string;
  editedText: string;
  confidence: number;
  position: Position;
  styling: TextStyling;
  zIndex: number;
}

export function getLayerDisplayText(layer: Layer): string {
  return layer.editedText;
}

export function isLayerModified(layer: Layer): boolean {
  return layer.editedText !== layer.originalText;
}

export function calculatePosition(
  region: Region,
  containerWidth: number,
  containerHeight: number
): Position {
  const px = (region.x / 100) * containerWidth;
  const py = (region.y / 100) * containerHeight;
  const pw = (region.width / 100) * containerWidth;
  const ph = (region.height / 100) * containerHeight;

  return {
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    px,
    py,
    pw,
    ph,
  };
}