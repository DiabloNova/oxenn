import type { CSSProperties, ReactElement, ReactNode } from "react";

export type FluidGlassShape =
  | "lens"
  | "blob"
  | "cube"
  | "pill"
  | "torus"
  | "prism"
  | "diamond";

export interface FluidGlassProps {
  text?: string;
  textColor?: string;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  src?: string;
  fit?: "cover" | "contain";
  background?: string;
  shape?: FluidGlassShape;
  shapes?: FluidGlassShape[];
  size?: number;
  refraction?: number;
  dispersion?: number;
  reflection?: number;
  frost?: number;
  color?: string;
  tint?: number;
  shadow?: number;
  elevation?: number;
  interaction?: "follow" | "static" | "drag";
  smoothness?: number;
  wobble?: number;
  spin?: number;
  idle?: boolean;
  morphOnClick?: boolean;
  onShapeChange?: (shape: FluidGlassShape) => void;
  position?: [number, number];
  intro?: boolean;
  maxDevicePixelRatio?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

declare function FluidGlass(props: FluidGlassProps): ReactElement;

export default FluidGlass;
