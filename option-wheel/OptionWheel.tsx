'use client';

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import './OptionWheel.css';

const DEFAULT_ITEMS = [
  'Ambient', 'House', 'Techno', 'Jazz', 'Lo-Fi', 'Synthwave',
  'Trance', 'Funk', 'Disco', 'Hip-Hop', 'Chillwave', 'Drum & Bass'
];

export type OptionWheelSide = 'left' | 'right';

export type OptionWheelProps = {
  items?: string[];
  defaultSelected?: number;
  onChange?: (index: number, item: string) => void;
  textColor?: string;
  activeColor?: string;
  side?: OptionWheelSide;
  fontSize?: number;
  spacing?: number;
  curve?: number;
  tilt?: number;
  blur?: number;
  fade?: number;
  minOpacity?: number;
  smoothing?: number;
  inset?: number;
  loop?: boolean;
  draggable?: boolean;
  soundUrl?: string;
  soundVolume?: number;
  className?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function OptionWheel({
  items = DEFAULT_ITEMS,
  defaultSelected = 3,
  onChange,
  textColor = '#a6a6a6',
  activeColor = '#ffffff',
  side = 'left',
  fontSize = 3,
  spacing = 1.4,
  curve = 1,
  tilt = 6,
  blur = 2,
  fade = 0.25,
  minOpacity = 0.05,
  smoothing = 200,
  inset = 80,
  loop = false,
  draggable = true,
  soundUrl = '',
  soundVolume = 0.5,
  className = ''
}: OptionWheelProps) {
  const initialIndex = items.length > 0 && Number.isFinite(defaultSelected)
    ? clamp(Math.round(defaultSelected), 0, items.length - 1)
    : 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const posRef = useRef(initialIndex);
  const targetRef = useRef(initialIndex);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const cfgRef = useRef({});
  const onChangeRef = useRef(onChange);
  const selectedRef = useRef(initialIndex);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ y: number; start: number; id: number; itemIndex: number | null } | null>(null);
  const dragMovedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef('');
  const lastTickRef = useRef(0);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [isDragging, setIsDragging] = useState(false);
  const listId = useId();
  const remPx = typeof window !== 'undefined'
    ? Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16
    : 16;

  onChangeRef.current = onChange;
  cfgRef.current = {
    count: items.length,
    items,
    rowH: Math.max(fontSize * spacing * remPx, 1),
    curve,
    tilt,
    blur,
    fade,
    minOpacity: clamp(minOpacity, 0, 1),
    side,
    loop,
    smoothing,
    draggable,
    soundUrl,
    soundVolume
  };

  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const cfg = cfgRef.current as {
      count: number; rowH: number; curve: number; tilt: number; blur: number;
      fade: number; minOpacity: number; side: OptionWheelSide; loop: boolean; smoothing: number;
    };
    const tau = Math.max(cfg.smoothing, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);
    const target = targetRef.current;
    const cur = posRef.current;
    let next = cur + (target - cur) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    posRef.current = next;

    const mirror = cfg.side === 'right' ? -1 : 1;
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const radius = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;
    for (let i = 0; i < cfg.count; i++) {
      const element = itemRefs.current[i];
      if (!element) continue;
      let distanceFromCenter = i - next;
      if (cfg.loop && cfg.count > 1) {
        distanceFromCenter = ((distanceFromCenter % cfg.count) + cfg.count) % cfg.count;
        if (distanceFromCenter > cfg.count / 2) distanceFromCenter -= cfg.count;
      }
      const distance = Math.abs(distanceFromCenter);
      let x = 0;
      let y = distanceFromCenter * cfg.rowH;
      let rotation = 0;
      if (radius > 0) {
        const angle = clamp(distanceFromCenter * tiltRad, -Math.PI / 2, Math.PI / 2);
        y = radius * Math.sin(angle);
        x = -mirror * radius * (1 - Math.cos(angle)) * cfg.curve;
        rotation = (mirror * angle * 180) / Math.PI;
      }
      element.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rotation.toFixed(3)}deg)`;
      element.style.opacity = String(Math.max(cfg.minOpacity, 1 - distance * cfg.fade));
      element.style.filter = cfg.blur > 0 ? `blur(${(distance * cfg.blur).toFixed(2)}px)` : 'none';
      element.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(distance, 1)).toFixed(4));
    }
    rafRef.current = settled ? null : requestAnimationFrame(runFrame);
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const playTick = useCallback(() => {
    const cfg = cfgRef.current as { soundUrl: string; soundVolume: number };
    if (!cfg.soundUrl) return;
    const now = performance.now();
    if (now - lastTickRef.current < 70) return;
    lastTickRef.current = now;
    try {
      if (!audioRef.current || audioUrlRef.current !== cfg.soundUrl) {
        audioRef.current?.pause();
        audioRef.current = new Audio(cfg.soundUrl);
        audioRef.current.preload = 'auto';
        audioUrlRef.current = cfg.soundUrl;
      }
      const audio = audioRef.current;
      audio.volume = clamp(cfg.soundVolume, 0, 1);
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    } catch {
      // Audio is an optional enhancement; unsupported playback must not break selection.
    }
  }, []);

  const applyTarget = useCallback((value: number, snap: boolean) => {
    const cfg = cfgRef.current as { count: number; items: string[]; loop: boolean };
    if (cfg.count === 0) {
      targetRef.current = 0;
      posRef.current = 0;
      selectedRef.current = 0;
      setSelectedIndex(0);
      return;
    }
    let nextValue = value;
    if (!cfg.loop) nextValue = clamp(nextValue, 0, cfg.count - 1);
    if (snap) nextValue = Math.round(nextValue);
    targetRef.current = nextValue;
    const index = ((Math.round(nextValue) % cfg.count) + cfg.count) % cfg.count;
    if (index !== selectedRef.current) {
      selectedRef.current = index;
      setSelectedIndex(index);
      onChangeRef.current?.(index, cfg.items[index]);
      playTick();
    }
    startLoop();
  }, [playTick, startLoop]);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const cfg = cfgRef.current as { rowH: number };
      const delta = event.deltaMode === 1 ? event.deltaY * 24 : event.deltaY;
      const step = clamp(delta / cfg.rowH, -1, 1);
      applyTarget(targetRef.current + step, false);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => applyTarget(targetRef.current, true), 140);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = null;
    };
  }, [applyTarget]);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!draggable || event.button !== 0) return;
    const optionTarget = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-option-index]')
      : null;
    const itemIndex = optionTarget ? Number(optionTarget.dataset.optionIndex) : null;
    dragRef.current = {
      y: event.clientY,
      start: targetRef.current,
      id: event.pointerId,
      itemIndex: itemIndex !== null && Number.isInteger(itemIndex) ? itemIndex : null
    };
    // Capture immediately so pointer-up is delivered even if the pointer leaves the wheel
    // before the drag threshold is crossed.
    rootRef.current?.setPointerCapture(event.pointerId);
    dragMovedRef.current = false;
    setIsDragging(true);
  }, [draggable]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const deltaY = event.clientY - drag.y;
    if (!dragMovedRef.current && Math.abs(deltaY) > 4) {
      dragMovedRef.current = true;
    }
    if (dragMovedRef.current) {
      const cfg = cfgRef.current as { rowH: number };
      applyTarget(drag.start - deltaY / cfg.rowH, false);
    }
  }, [applyTarget]);

  const handlePointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.id !== event.pointerId) return;
    const clickedItemIndex = dragRef.current.itemIndex;
    dragRef.current = null;
    setIsDragging(false);
    if (dragMovedRef.current) {
      applyTarget(targetRef.current, true);
    } else if (clickedItemIndex !== null) {
      const cfg = cfgRef.current as { count: number; loop: boolean };
      if (cfg.count > 0) {
        const current = targetRef.current;
        let delta = clickedItemIndex - (((current % cfg.count) + cfg.count) % cfg.count);
        if (cfg.loop && cfg.count > 1) {
          if (delta > cfg.count / 2) delta -= cfg.count;
          else if (delta < -cfg.count / 2) delta += cfg.count;
        }
        applyTarget(current + delta, true);
      }
    }
    dragMovedRef.current = false;
  }, [applyTarget]);

  const handleItemClick = useCallback((index: number) => {
    if (dragMovedRef.current) return;
    const cfg = cfgRef.current as { count: number; loop: boolean };
    if (cfg.count === 0) return;
    const current = targetRef.current;
    let delta = index - (((current % cfg.count) + cfg.count) % cfg.count);
    if (cfg.loop && cfg.count > 1) {
      if (delta > cfg.count / 2) delta -= cfg.count;
      else if (delta < -cfg.count / 2) delta += cfg.count;
    }
    applyTarget(current + delta, true);
  }, [applyTarget]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    let delta: number | null = null;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') delta = -1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') delta = 1;
    if (delta === null) return;
    event.preventDefault();
    applyTarget(Math.round(targetRef.current) + delta, true);
  }, [applyTarget]);

  useEffect(() => {
    applyTarget(targetRef.current, false);
  }, [items, fontSize, spacing, curve, tilt, blur, fade, minOpacity, side, loop, smoothing, applyTarget]);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    audioRef.current?.pause();
    rafRef.current = null;
  }, []);

  const style = {
    '--ow-text-color': textColor,
    '--ow-active-color': activeColor,
    '--ow-font-size': `${fontSize}rem`,
    '--ow-inset': `${Math.max(0, inset)}px`
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      id={listId}
      role="listbox"
      tabIndex={0}
      aria-label="Option wheel"
      aria-activedescendant={items.length > 0 ? `${listId}-option-${selectedIndex}` : undefined}
      aria-orientation="vertical"
      className={`option-wheel${side === 'right' ? ' option-wheel--right' : ''}${isDragging ? ' option-wheel--dragging' : ''}${!draggable ? ' option-wheel--static' : ''}${className ? ` ${className}` : ''}`}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((label, index) => (
        <div
          key={`${label}-${index}`}
          id={`${listId}-option-${index}`}
          ref={(element) => { itemRefs.current[index] = element; }}
          role="option"
          data-option-index={index}
          aria-selected={selectedIndex === index}
          className={`option-wheel__item${selectedIndex === index ? ' option-wheel__item--selected' : ''}`}
          onClick={() => handleItemClick(index)}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
