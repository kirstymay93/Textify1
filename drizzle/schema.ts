export interface TextRegion {
  id: number;
  originalText: string;
  editedText?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  confidence?: number;
}
