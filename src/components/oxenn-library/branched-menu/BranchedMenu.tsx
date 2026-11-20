'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import styles from './BranchedMenu.module.css';

const DEFAULT_ITEMS: BranchedMenuSection[] = [
  {
    label: 'Getting started',
    children: [
      { value: 'install', label: 'Installation' },
      { value: 'quick', label: 'Quick start' },
      { value: 'config', label: 'Configuration' },
      { value: 'theming', label: 'Theming' },
    ],
  },
  {
    label: 'Components',
    children: [
      { value: 'buttons', label: 'Buttons' },
      { value: 'typography', label: 'Typography' },
      { value: 'overlays', label: 'Overlays' },
      { value: 'toasts', label: 'Toasts' },
    ],
  },
];

const PAD = 6;
const MARKER_SIZE = 16;

export type BranchedMenuItem = {
  value: string;
  label: string;
  icon?: ReactNode;
};

export type BranchedMenuSection = {
  label: string;
  value?: string;
  children?: BranchedMenuItem[];
};

export type BranchedMenuProps = {
  items?: BranchedMenuSection[];
  defaultOpen?: number | number[];
  defaultActive?: string;
  onSelect?: (value: string, item: BranchedMenuItem | BranchedMenuSection) => void;
  onToggle?: (index: number, isOpen: boolean) => void;
  color?: string;
  accentColor?: string;
  lineColor?: string;
  width?: number;
  rowHeight?: number;
  indent?: number;
  trunk?: number;
  radius?: number;
  lineWidth?: number;
  fontSize?: number;
  drawDuration?: number;
  foldDuration?: number;
  className?: string;
  label?: string;
};

function toSet(open: number | number[] | undefined) {
  if (Array.isArray(open)) {
    return new Set(open.filter((index) => Number.isInteger(index) && index >= 0));
  }
  return new Set(typeof open === 'number' && Number.isInteger(open) && open >= 0 ? [open] : []);
}

export default function BranchedMenu({
  items = DEFAULT_ITEMS,
  defaultOpen = 0,
  defaultActive = '',
  onSelect,
  onToggle,
  color = '#f5f5f5',
  accentColor = '#f5f5f5',
  lineColor = '#3f3f46',
  width = 240,
  rowHeight = 36,
  indent = 40,
  trunk = 14,
  radius = 10,
  lineWidth = 1.5,
  fontSize = 14,
  drawDuration = 400,
  foldDuration = 300,
  className = '',
  label = 'Branched menu',
}: BranchedMenuProps) {
  const initialOpen = toSet(defaultOpen);
  const [open, setOpen] = useState<Set<number>>(() => initialOpen);
  const [active, setActive] = useState(() => {
    if (defaultActive) return defaultActive;
    const firstOpenSection = items.find((item, index) => item.children && initialOpen.has(index));
    return firstOpenSection?.children?.[0]?.value ?? '';
  });
  const navRef = useRef<HTMLElement>(null);
  const heads = useRef<Array<HTMLButtonElement | null>>([]);
  const markerRef = useRef<HTMLSpanElement>(null);

  const activeSection = items.findIndex((item) => item.children?.some((child) => child.value === active));
  const markerShown = activeSection >= 0 && open.has(activeSection);

  useLayoutEffect(() => {
    const placeMarker = (animate: boolean) => {
      const marker = markerRef.current;
      const heading = heads.current[activeSection];
      if (!marker) return;

      if (!animate) marker.style.transition = 'none';
      if (markerShown && heading) {
        marker.style.top = `${heading.offsetTop + (heading.offsetHeight - MARKER_SIZE) / 2}px`;
      }
      marker.toggleAttribute('data-on', Boolean(markerShown && heading));

      if (!animate) {
        void marker.offsetHeight;
        marker.style.transition = '';
      }
    };

    placeMarker(true);
    if (typeof ResizeObserver === 'undefined' || !navRef.current) return;

    let firstObservation = true;
    const observer = new ResizeObserver(() => {
      if (firstObservation) {
        firstObservation = false;
        return;
      }
      placeMarker(false);
    });
    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, [activeSection, markerShown, fontSize, rowHeight]);

  const selectItem = (value: string, item: BranchedMenuItem | BranchedMenuSection) => {
    setActive(value);
    onSelect?.(value, item);
  };

  const toggleSection = (index: number) => {
    const isOpen = !open.has(index);
    setOpen((current) => {
      const next = new Set(current);
      if (isOpen) next.add(index);
      else next.delete(index);
      return next;
    });
    onToggle?.(index, isOpen);
  };

  const safeRowHeight = Math.max(20, rowHeight);
  const safeIndent = Math.max(12, indent);
  const safeTrunk = Math.max(4, Math.min(trunk, safeIndent - 8));
  const cornerRadius = Math.max(
    0,
    Math.min(radius, safeRowHeight / 2 - 2, safeIndent - 8 - safeTrunk),
  );
  const endX = safeIndent - 8;
  const rowY = (index: number) => PAD + index * safeRowHeight + safeRowHeight / 2;
  const branch = (index: number) =>
    `M ${safeTrunk} ${rowY(index) - cornerRadius} A ${cornerRadius} ${cornerRadius} 0 0 0 ${safeTrunk + cornerRadius} ${rowY(index)} H ${endX}`;
  const reach = (index: number) =>
    `M ${safeTrunk} 0 V ${rowY(index) - cornerRadius} A ${cornerRadius} ${cornerRadius} 0 0 0 ${safeTrunk + cornerRadius} ${rowY(index)} H ${endX}`;
  const pathLength = (index: number) =>
    rowY(index) - cornerRadius + (Math.PI * cornerRadius) / 2 + (endX - safeTrunk - cornerRadius);

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className={`${styles.menu}${className ? ` ${className}` : ''}`}
      style={{
        '--bm-width': `${Math.max(0, width)}px`,
        '--bm-ink': color,
        '--bm-accent': accentColor,
        '--bm-line': lineColor,
        '--bm-font': `${fontSize}px`,
        '--bm-row': `${safeRowHeight}px`,
        '--bm-indent': `${safeIndent}px`,
        '--bm-line-width': lineWidth,
        '--bm-draw-duration': `${Math.max(0, drawDuration)}ms`,
        '--bm-fold-duration': `${Math.max(0, foldDuration)}ms`,
      } as React.CSSProperties}
    >
      <span ref={markerRef} className={styles.marker} aria-hidden="true" />
      {items.map((item, index) => {
        const hasChildren = Array.isArray(item.children);
        const isOpen = hasChildren && open.has(index);
        const leafValue = item.value ?? item.label;
        const leafActive = !hasChildren && leafValue === active;
        const children = item.children ?? [];
        const bodyHeight = PAD * 2 + children.length * safeRowHeight;

        return (
          <div
            key={item.value ?? item.label}
            className={styles.section}
            data-open={isOpen ? '' : undefined}
          >
            <button
              ref={(element) => {
                heads.current[index] = element;
              }}
              type="button"
              className={styles.heading}
              aria-expanded={hasChildren ? isOpen : undefined}
              aria-current={leafActive ? 'page' : undefined}
              data-active={leafActive ? '' : undefined}
              onClick={() => (hasChildren ? toggleSection(index) : selectItem(leafValue, item))}
            >
              {item.label}
            </button>

            {hasChildren ? (
              <div className={styles.body} aria-hidden={!isOpen}>
                <div className={styles.fold} inert={!isOpen}>
                  <div className={styles.tree} style={{ height: bodyHeight }}>
                    <svg
                      className={styles.lines}
                      width={safeIndent}
                      height={bodyHeight}
                      aria-hidden="true"
                      focusable="false"
                    >
                      {children.length > 0 ? (
                        <path
                          className={styles.base}
                          d={`M ${safeTrunk} 0 V ${rowY(children.length - 1) - cornerRadius}`}
                        />
                      ) : null}
                      {children.map((child, childIndex) => (
                        <path key={child.value} className={styles.base} d={branch(childIndex)} />
                      ))}
                      {children.map((child, childIndex) => {
                        const length = pathLength(childIndex);
                        return (
                          <path
                            key={child.value}
                            className={styles.reach}
                            d={reach(childIndex)}
                            style={{
                              strokeDasharray: length,
                              strokeDashoffset: child.value === active && isOpen ? 0 : length,
                            }}
                          />
                        );
                      })}
                    </svg>
                    {children.map((child) => (
                      <button
                        key={child.value}
                        type="button"
                        className={styles.item}
                        aria-current={child.value === active ? 'page' : undefined}
                        data-active={child.value === active ? '' : undefined}
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() => selectItem(child.value, child)}
                      >
                        {child.icon ? <span className={styles.icon} aria-hidden="true">{child.icon}</span> : null}
                        <span className={styles.itemLabel}>{child.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
