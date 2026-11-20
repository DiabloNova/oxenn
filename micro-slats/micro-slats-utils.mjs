/**
 * Select only supported presets. A switch keeps arbitrary runtime keys away from
 * the preset record (including inherited keys such as `constructor`).
 * @template T
 * @param {string | undefined} preset
 * @param {{ swell: T, tide: T, storm: T, signal: T }} presets
 * @returns {T}
 */
export function selectSwellPreset(preset, presets) {
  switch (preset) {
    case 'tide': return presets.tide;
    case 'storm': return presets.storm;
    case 'signal': return presets.signal;
    case 'swell':
    default: return presets.swell;
  }
}

/**
 * Keep renderer initialization failures local to this decorative component.
 * @template T
 * @param {() => T} create
 * @returns {T | null}
 */
export function createRendererSafely(create) {
  try {
    return create();
  } catch {
    return null;
  }
}

/**
 * Subscribe to live reduced-motion changes and return an exact cleanup function.
 * @param {MediaQueryList} mediaQuery
 * @param {(matches: boolean) => void} onChange
 * @returns {() => void}
 */
export function subscribeToReducedMotion(mediaQuery, onChange) {
  const handleChange = () => onChange(mediaQuery.matches);
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}


/**
 * Decide whether an animation frame should be queued without coupling the
 * scheduler to browser globals.
 * @param {boolean} visible
 * @param {boolean} documentHidden
 * @param {boolean} moving
 * @param {boolean} fluidActive
 * @param {boolean} fluidDirty
 * @returns {boolean}
 */
export function shouldScheduleFrame(visible, documentHidden, moving, fluidActive, fluidDirty) {
  return visible && !documentHidden && (moving || fluidActive || fluidDirty);
}
