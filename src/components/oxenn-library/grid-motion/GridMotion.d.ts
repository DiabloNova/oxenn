import type { CSSProperties, ReactNode } from 'react';

export type GridMotionItem =
  | ReactNode
  | {
      src: string;
      alt?: string;
    };

export interface GridMotionProps {
  items?: GridMotionItem[];
  rows?: number;
  aspectRatio?: number;
  gap?: number;
  radius?: number;
  angle?: number;
  tilt?: number;
  speed?: number;
  direction?: 'alternate' | 'left' | 'right';
  parallax?: number;
  spotlight?: number;
  dim?: number;
  grayscale?: boolean;
  fade?: number;
  tileColor?: string;
  textColor?: string;
  theme?: 'dark' | 'light';
  className?: string;
  style?: CSSProperties;
}

declare function GridMotion(props: GridMotionProps): ReactNode;

export default GridMotion;
