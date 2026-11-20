const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, t) => a + (b - a) * t;
const ANCHORS = { left: 0.27, center: 0.5, right: 0.73 };

export const parseColor = (value, fallback, createContext = () => document.createElement('canvas').getContext('2d')) => {
  try {
    const ctx = createContext();
    if (!ctx) return fallback;
    const firstSentinel = '#010203';
    const secondSentinel = '#040506';
    ctx.fillStyle = firstSentinel;
    ctx.fillStyle = value;
    const firstResult = ctx.fillStyle;
    ctx.fillStyle = secondSentinel;
    ctx.fillStyle = value;
    const resolved = ctx.fillStyle;
    if (firstResult !== resolved) return fallback;
    if (resolved.startsWith('#')) {
      const n = parseInt(resolved.slice(1), 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    if (!/^rgba?\(/i.test(resolved)) return fallback;
    const parts = resolved.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return fallback;
    return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
  } catch {
    return fallback;
  }
};

export const calculateCameraFrame = ({ layout, size, strapLength, anchor, width, height, fov = 24 }) => {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const aspect = safeWidth / safeHeight;
  const strapOffset = mix(0.12, 0.42, clamp(strapLength, 0, 1));
  let viewHeight = Math.max(layout.height / clamp(size, 0.15, 0.9), layout.height / (1 - strapOffset));
  const anchorPosition = ANCHORS[anchor] ?? 0.5;
  const availableWidthRatio = Math.min(0.72, 2 * Math.min(anchorPosition, 1 - anchorPosition));
  const minimumWidth = layout.width / Math.max(availableWidthRatio, 0.01);
  if (viewHeight * aspect < minimumWidth) viewHeight = minimumWidth / aspect;
  const viewWidth = viewHeight * aspect;
  const cardTop = viewHeight / 2 - viewHeight * strapOffset;
  const hangTop = cardTop + (layout.hangY - layout.height / 2);
  return {
    aspect,
    viewHeight,
    viewWidth,
    anchorX: (anchorPosition - 0.5) * viewWidth,
    anchorY: viewHeight / 2 + 0.2,
    hangTop,
    cameraZ: viewHeight / 2 / Math.tan((fov * Math.PI) / 360)
  };
};

export const createRendererSafely = create => {
  try {
    return create();
  } catch {
    return null;
  }
};

export const disposeWebGLRenderer = renderer => {
  try {
    renderer.dispose();
  } finally {
    renderer.forceContextLoss();
  }
};
