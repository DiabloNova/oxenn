import type { CSSProperties } from "react";

export type LanyardOrientation = "portrait" | "landscape";
export type LanyardFinish = "glossy" | "matte" | "holographic" | "metallic";
export type LanyardAnchor = "left" | "center" | "right";
export type LanyardMetal = "silver" | "gold" | "graphite";

export interface LanyardProps {
  frontImage?: string;
  backImage?: string;
  strapImage?: string;
  imageFit?: "cover" | "contain";
  cardColor?: string;
  orientation?: LanyardOrientation;
  finish?: LanyardFinish;
  cornerRadius?: number;
  size?: number;
  anchor?: LanyardAnchor;
  strapLength?: number;
  strapColor?: string;
  strapWidth?: number;
  metal?: LanyardMetal;
  gravity?: number;
  damping?: number;
  elasticity?: number;
  breeze?: number;
  interactive?: boolean;
  intro?: boolean;
  className?: string;
  style?: CSSProperties;
}

declare function Lanyard(props: LanyardProps): import("react").JSX.Element;
export default Lanyard;
