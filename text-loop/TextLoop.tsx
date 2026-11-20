'use client';

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { gsap } from 'gsap';
import styles from './TextLoop.module.css';

const VIEW_W = 1200;
const VIEW_H = 520;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const EDGE_PAD = 6;
const MAX_FLING = 2600;

type Shape = 'line' | 'wave' | 'arch' | 'circle' | 'infinity';
type Direction = 'forward' | 'reverse';

export interface TextLoopProps {
  text?: string;
  shape?: Shape;
  path?: string;
  speed?: number;
  direction?: Direction;
  separator?: string;
  curviness?: number;
  tilt?: number;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  uppercase?: boolean;
  color?: string;
  ribbon?: boolean;
  ribbonColor?: string;
  ribbonWidth?: number;
  edgeFade?: number;
  pauseOnHover?: boolean;
  cross?: boolean;
  crossColor?: string;
  crossAngle?: number;
  draggable?: boolean;
  scrollBoost?: number;
  outline?: boolean;
  outlineWidth?: number;
  className?: string;
  style?: CSSProperties;
}

type Metrics = { length: number; reps: number; crossLength: number; crossReps: number };

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap = (value: number, length: number) => ((value % length) + length) % length;

function buildPath(shape: Shape, curviness: number, ribbonWidth: number, mirrored = false) {
  const c = Math.max(0, curviness);
  const room = Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);
  const flip = mirrored ? -1 : 1;

  switch (shape) {
    case 'circle': {
      const r = Math.min(90 + c * 0.95, room);
      if (mirrored) {
        const rx = r * 1.22;
        const ry = r * 0.42;
        return `M ${CX - rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX + rx} ${CY} A ${rx} ${ry} 0 1 1 ${CX - rx} ${CY} Z`;
      }
      return `M ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} Z`;
    }
    case 'infinity': {
      const maxRadius = Math.max(0, CX - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);
      const r = Math.min(150 + c * 1.4, maxRadius);
      const h = Math.min(60 + c * 0.95, room);
      return [
        `M ${CX} ${CY}`,
        `C ${CX + r * 0.55} ${CY - h} ${CX + r} ${CY - h} ${CX + r} ${CY}`,
        `C ${CX + r} ${CY + h} ${CX + r * 0.55} ${CY + h} ${CX} ${CY}`,
        `C ${CX - r * 0.55} ${CY - h} ${CX - r} ${CY - h} ${CX - r} ${CY}`,
        `C ${CX - r} ${CY + h} ${CX - r * 0.55} ${CY + h} ${CX} ${CY}`,
        'Z',
      ].join(' ');
    }
    case 'arch': {
      const rise = Math.min(120 + c * 1.1, room * 2) * flip;
      return `M 120 ${CY + rise / 2} Q ${CX} ${CY - rise * 1.5} ${VIEW_W - 120} ${CY + rise / 2}`;
    }
    case 'line':
      return `M -320 ${CY} L ${VIEW_W + 320} ${CY}`;
    case 'wave':
    default: {
      const amplitude = Math.min(c * 2.2, room * 2) * flip;
      return `M -320 ${CY} Q -160 ${CY - amplitude} 0 ${CY} T 320 ${CY} T 640 ${CY} T 960 ${CY} T 1280 ${CY} T ${VIEW_W + 320} ${CY}`;
    }
  }
}

export default function TextLoop({
  text = 'React ✦ Bits',
  shape = 'wave',
  path,
  speed = 90,
  direction = 'forward',
  separator = '✦',
  curviness = 90,
  tilt = 0,
  fontSize = 46,
  fontWeight = 800,
  letterSpacing = 2,
  uppercase = true,
  color,
  ribbon = true,
  ribbonColor = '#5227FF',
  ribbonWidth = 86,
  edgeFade = 0,
  pauseOnHover = true,
  cross = false,
  crossColor,
  crossAngle = 16,
  draggable = false,
  scrollBoost = 0,
  outline = false,
  outlineWidth = 1.5,
  className = '',
  style,
}: TextLoopProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const crossPathRef = useRef<SVGPathElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const headRef = useRef<SVGTextPathElement>(null);
  const tailRef = useRef<SVGTextPathElement>(null);
  const crossHeadRef = useRef<SVGTextPathElement>(null);
  const crossTailRef = useRef<SVGTextPathElement>(null);
  const progressRef = useRef(0);
  const hoverRef = useRef({ scale: 1 });
  const hoveredRef = useRef(false);
  const [metrics, setMetrics] = useState<Metrics>({ length: 0, reps: 1, crossLength: 0, crossReps: 1 });

  const rawId = useId();
  const pathId = `text-loop-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const crossId = `${pathId}-cross`;
  const fadeId = `${pathId}-fade`;
  const maskId = `${pathId}-mask`;
  const customPath = Boolean(path);
  const d = useMemo(() => path || buildPath(shape, curviness, ribbonWidth), [path, shape, curviness, ribbonWidth]);
  const crossD = useMemo(
    () => (cross ? path || buildPath(shape, curviness, ribbonWidth, shape === 'wave' || shape === 'arch' || shape === 'circle') : ''),
    [cross, path, shape, curviness, ribbonWidth],
  );
  const unit = useMemo(() => {
    const base = uppercase ? String(text).toUpperCase() : String(text);
    return `${base}${separator ? `\u00A0${separator}\u00A0` : '\u00A0\u00A0\u00A0'}`;
  }, [text, separator, uppercase]);
  const textStyle = useMemo<CSSProperties>(
    () => ({ fontSize: `${fontSize}px`, fontWeight, letterSpacing: `${letterSpacing}px` }),
    [fontSize, fontWeight, letterSpacing],
  );
  const mainAngle = tilt + (cross ? crossAngle / 2 : 0);
  const secondaryAngle = tilt - (cross ? crossAngle / 2 : 0);
  const mainTransform = mainAngle ? `rotate(${mainAngle} ${CX} ${CY})` : undefined;
  const secondaryTransform = secondaryAngle ? `rotate(${secondaryAngle} ${CX} ${CY})` : undefined;
  // Mix the source color toward white so the dark overprint remains legible for any valid CSS color.
  const crossTape = `color-mix(in srgb, ${crossColor || ribbonColor} 38%, white)`;
  const fill = color || (ribbon ? '#ffffff' : 'currentColor');
  const secondaryFill = ribbon ? '#120f17' : crossColor || 'currentColor';
  const fadeWidth = clamp(edgeFade, 0, 1) * 0.3;
  const fadeStops = useMemo(
    () => Array.from({ length: 9 }, (_, index) => index / 8),
    [],
  );

  useIsomorphicLayoutEffect(() => {
    const pathElement = pathRef.current;
    const measureElement = measureRef.current;
    if (!pathElement || !measureElement) return;
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      try {
        const length = pathElement.getTotalLength();
        const unitWidth = measureElement.getComputedTextLength();
        const crossLength = crossPathRef.current?.getTotalLength() || 0;
        if (!length) return;
        const repsFor = (total: number) => (unitWidth > 0 ? Math.max(1, Math.round(total / unitWidth)) : 1);
        const next = { length, reps: repsFor(length), crossLength, crossReps: repsFor(crossLength) };
        setMetrics((previous) =>
          previous.length === next.length &&
          previous.reps === next.reps &&
          previous.crossLength === next.crossLength &&
          previous.crossReps === next.crossReps
            ? previous
            : next,
        );
      } catch {
        // SVG text measurement is unavailable until the browser has laid out the SVG.
      }
    };

    measure();
    if (typeof document !== 'undefined' && document.fonts?.ready) void document.fonts.ready.then(measure).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [d, crossD, unit, fontSize, fontWeight, letterSpacing]);

  useIsomorphicLayoutEffect(() => {
    const { length, crossLength } = metrics;
    const head = headRef.current;
    const tail = tailRef.current;
    const root = rootRef.current;
    const svg = svgRef.current;
    if (!head || !tail || !root || !svg || !length) return;

    const crossHead = crossHeadRef.current;
    const crossTail = crossTailRef.current;
    const crossPaths = cross && crossHead && crossTail && crossLength > 0 ? [crossHead, crossTail] : null;
    let travel = progressRef.current * length;
    const apply = () => {
      const offset = wrap(travel, length);
      progressRef.current = offset / length;
      head.setAttribute('startOffset', String(offset));
      tail.setAttribute('startOffset', String(offset - length));
      if (crossPaths) {
        const crossOffset = wrap(-travel, crossLength);
        crossPaths[0].setAttribute('startOffset', String(crossOffset));
        crossPaths[1].setAttribute('startOffset', String(crossOffset - crossLength));
      }
    };
    apply();

    const reduced = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
    const sign = direction === 'reverse' ? -1 : 1;
    const base = reduced ? 0 : Math.max(0, speed) * sign;
    const hover = hoverRef.current;
    const angle = (mainAngle * Math.PI) / 180;
    const circular = !customPath && shape === 'circle';
    const radius = Math.min(90 + Math.max(0, curviness) * 0.95, Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD));
    let fling = 0;
    let dragging = false;
    let pointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;
    let center = { x: 0, y: 0 };
    let running = false;
    let scrollVelocity = 0;
    let scrollAt = 0;
    let scrollPosition = 0;
    let scrollSource: EventTarget | null = null;
    let boost = 0;

    const tick = (_time: number, deltaMs: number) => {
      if (dragging) return;
      const dt = Math.min(0.05, deltaMs / 1000);
      fling *= Math.exp(-dt / 0.55);
      if (scrollBoost > 0 && !reduced) {
        if (performance.now() - scrollAt > 90) scrollVelocity *= Math.exp(-dt / 0.12);
        const target = clamp(scrollVelocity * scrollBoost * 0.35 * sign, -1600, 1600);
        boost += (target - boost) * (1 - Math.exp(-dt / 0.18));
      }
      const velocityNow = base * hover.scale + fling + boost;
      if (Math.abs(velocityNow) < 0.01) return;
      travel += velocityNow * dt;
      apply();
    };
    const start = () => {
      if (running || reduced) return;
      running = true;
      gsap.ticker.add(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    };
    const glide = (hovered: boolean) =>
      gsap.to(hover, {
        scale: hovered ? 0 : 1,
        duration: hovered ? 0.6 : 0.9,
        ease: hovered ? 'power2.out' : 'power2.inOut',
        overwrite: true,
      });
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      hoveredRef.current = true;
      glide(true);
    };
    const onLeave = () => {
      hoveredRef.current = false;
      glide(false);
    };
    const onDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      pointerId = event.pointerId;
      root.setPointerCapture?.(event.pointerId);
      lastX = event.clientX;
      lastY = event.clientY;
      lastTime = performance.now();
      velocity = base * hover.scale + fling + boost;
      const rect = svg.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      const now = performance.now();
      let delta: number;
      if (circular) {
        let turn =
          Math.atan2(event.clientY - center.y, event.clientX - center.x) -
          Math.atan2(lastY - center.y, lastX - center.x);
        if (turn > Math.PI) turn -= Math.PI * 2;
        if (turn < -Math.PI) turn += Math.PI * 2;
        delta = turn * radius;
      } else {
        const scale = VIEW_W / (svg.getBoundingClientRect().width || VIEW_W);
        delta = ((event.clientX - lastX) * Math.cos(angle) + (event.clientY - lastY) * Math.sin(angle)) * scale;
      }
      travel += delta;
      apply();
      const dt = Math.max(1, now - lastTime) / 1000;
      velocity = velocity * 0.6 + (delta / dt) * 0.4;
      lastX = event.clientX;
      lastY = event.clientY;
      lastTime = now;
    };
    const onUp = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      const release = performance.now() - lastTime > 90 ? 0 : clamp(velocity, -MAX_FLING, MAX_FLING);
      fling = reduced ? 0 : release - (base * hover.scale + boost);
    };
    const onScroll = (event: Event) => {
      const source = event.target;
      const isPage = source === document || source === document.documentElement || source === document.body;
      if (!isPage && (!(source instanceof Node) || !source.contains(root))) return;
      const position = isPage ? window.scrollY : (source as HTMLElement).scrollTop;
      const now = performance.now();
      if (source !== scrollSource || now - scrollAt > 200) {
        scrollSource = source;
        scrollPosition = position;
        scrollAt = now;
        return;
      }
      const instant = (position - scrollPosition) / (Math.max(8, now - scrollAt) / 1000);
      scrollVelocity = scrollVelocity * 0.5 + instant * 0.5;
      scrollPosition = position;
      scrollAt = now;
    };

    if (pauseOnHover) {
      root.addEventListener('pointerenter', onEnter);
      root.addEventListener('pointerleave', onLeave);
      const hoverCapable = Boolean(window.matchMedia?.('(hover: hover)')?.matches);
      const pointerIsInside = hoveredRef.current || (hoverCapable && root.matches(':hover'));
      hoveredRef.current = pointerIsInside;
      glide(pointerIsInside);
    } else {
      hoveredRef.current = false;
      hover.scale = 1;
    }
    if (draggable) {
      root.addEventListener('pointerdown', onDown);
      root.addEventListener('pointermove', onMove);
      root.addEventListener('pointerup', onUp);
      root.addEventListener('pointercancel', onUp);
    }
    if (scrollBoost > 0 && !reduced) window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
      : null;
    if (observer) observer.observe(root);
    else start();

    return () => {
      observer?.disconnect();
      stop();
      gsap.killTweensOf(hover);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      window.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, [metrics, speed, direction, pauseOnHover, draggable, scrollBoost, cross, customPath, shape, mainAngle, curviness, ribbonWidth]);

  const loopText = unit.repeat(metrics.reps);
  const crossText = unit.repeat(metrics.crossReps);
  const paint = (ink: string) =>
    outline
      ? { fill: 'none', stroke: ink, strokeWidth: outlineWidth, strokeLinejoin: 'round' as const }
      : { fill: ink };
  const mainPaint = paint(fill);
  const crossPaint = paint(secondaryFill);

  return (
    <div
      ref={rootRef}
      className={[styles.root, draggable ? styles.draggable : '', className].filter(Boolean).join(' ')}
      style={style}
    >
      <svg
        ref={svgRef}
        className={styles.svg}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={text}
      >
        <defs>
          {fadeWidth > 0 && (
            <>
              <linearGradient id={fadeId} x1="0" y1="0" x2="1" y2="0">
                {fadeStops.map((stop, index) => (
                  <stop key={index} offset={stop * fadeWidth} stopColor="#fff" stopOpacity={stop * stop * (3 - 2 * stop)} />
                ))}
                {fadeStops.slice().reverse().map((stop, index) => (
                  <stop key={`end-${index}`} offset={1 - stop * fadeWidth} stopColor="#fff" stopOpacity={stop * stop * (3 - 2 * stop)} />
                ))}
              </linearGradient>
              <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
                <rect width={VIEW_W} height={VIEW_H} fill={`url(#${fadeId})`} />
              </mask>
            </>
          )}
        </defs>

        <text ref={measureRef} className={styles.measure} style={textStyle} aria-hidden="true">{unit}</text>
        <g mask={fadeWidth > 0 ? `url(#${maskId})` : undefined}>
          {cross && (
            <g transform={secondaryTransform}>
              <path
                ref={crossPathRef}
                id={crossId}
                d={crossD}
                fill="none"
                stroke={ribbon ? crossTape : 'none'}
                strokeWidth={ribbon ? ribbonWidth : 0}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text className={styles.text} style={textStyle} {...crossPaint} dominantBaseline="central" aria-hidden="true" textLength={metrics.crossLength || undefined} lengthAdjust="spacing">
                <textPath ref={crossHeadRef} href={`#${crossId}`} startOffset={0}>{crossText}</textPath>
              </text>
              <text className={styles.text} style={textStyle} {...crossPaint} dominantBaseline="central" aria-hidden="true" textLength={metrics.crossLength || undefined} lengthAdjust="spacing">
                <textPath ref={crossTailRef} href={`#${crossId}`} startOffset={0}>{crossText}</textPath>
              </text>
            </g>
          )}
          <g transform={mainTransform}>
            <path
              ref={pathRef}
              id={pathId}
              d={d}
              fill="none"
              stroke={ribbon ? ribbonColor : 'none'}
              strokeWidth={ribbon ? ribbonWidth : 0}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text className={styles.text} style={textStyle} {...mainPaint} dominantBaseline="central" aria-hidden="true" textLength={metrics.length || undefined} lengthAdjust="spacing">
              <textPath ref={headRef} href={`#${pathId}`} startOffset={0}>{loopText}</textPath>
            </text>
            <text className={styles.text} style={textStyle} {...mainPaint} dominantBaseline="central" aria-hidden="true" textLength={metrics.length || undefined} lengthAdjust="spacing">
              <textPath ref={tailRef} href={`#${pathId}`} startOffset={0}>{loopText}</textPath>
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
