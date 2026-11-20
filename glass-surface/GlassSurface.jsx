'use client';

/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useId, useRef, useState } from 'react';
import { bendShape, traceShape } from './glass-shape';
import { startGlassRenderer } from './glass-renderer';
import './GlassSurface.css';

/**
 * @typedef {Object} GlassSurfaceProps
 * @property {import('react').ReactNode} [children]
 * @property {number|string} [width]
 * @property {number|string} [height]
 * @property {number} [borderRadius]
 * @property {number} [borderWidth]
 * @property {number} [brightness]
 * @property {number} [opacity]
 * @property {number} [blur]
 * @property {number} [displace]
 * @property {number} [backgroundOpacity]
 * @property {number} [saturation]
 * @property {number} [distortionScale]
 * @property {number} [redOffset]
 * @property {number} [greenOffset]
 * @property {number} [blueOffset]
 * @property {'R'|'G'|'B'|'A'} [xChannel]
 * @property {'R'|'G'|'B'|'A'} [yChannel]
 * @property {string} [mixBlendMode]
 * @property {boolean} [refraction]
 * @property {'auto'|'webgl'} [renderer]
 * @property {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement|import('react').RefObject<any>|null} [backdrop]
 * @property {string|number} [backdropVersion] - Change this value when a canvas backdrop's pixels change.
 * @property {string} [shape]
 * @property {string} [className]
 * @property {import('react').CSSProperties} [style]
 */

/** @param {GlassSurfaceProps} props */
const GlassSurface = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  refraction = true,
  renderer = 'auto',
  backdrop,
  backdropVersion,
  shape,
  className = '',
  style = {}
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = 'glass-filter-' + uniqueId;
  const redGradId = 'red-grad-' + uniqueId;
  const blueGradId = 'blue-grad-' + uniqueId;
  const softId = 'soft-' + uniqueId;

  const [svgSupported, setSvgSupported] = useState(false);
  const [checked, setChecked] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const [boxSize, setBoxSize] = useState('');
  const [loaded, setLoaded] = useState({ src: '', image: null });
  const [art, setArt] = useState(null);

  const containerRef = useRef(null);
  const feImageRef = useRef(null);
  const redChannelRef = useRef(null);
  const greenChannelRef = useRef(null);
  const blueChannelRef = useRef(null);
  const gaussianBlurRef = useRef(null);
  const traceRef = useRef(null);
  const shapeMapRef = useRef('');
  const mapUrlRef = useRef('');
  const canvasRef = useRef(null);
  const settingsRef = useRef(null);
  const renderWakeRef = useRef(null);

  settingsRef.current = {
    backdrop,
    backdropVersion,
    displace,
    saturation,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel
  };

  const generateDisplacementMap = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width || 400;
    const actualHeight = rect?.height || 200;
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);
    const svgContent = [
      '<svg width="' + actualWidth + '" height="' + actualHeight + '" viewBox="0 0 ' +
        actualWidth + ' ' + actualHeight + '" xmlns="http://www.w3.org/2000/svg">',
      '<defs>',
      '<linearGradient id="' + redGradId + '" x1="100%" y1="0%" x2="0%" y2="0%">',
      '<stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/>',
      '</linearGradient>',
      '<linearGradient id="' + blueGradId + '" x1="0%" y1="0%" x2="0%" y2="100%">',
      '<stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/>',
      '</linearGradient>',
      '<filter id="' + softId + '" filterUnits="userSpaceOnUse" x="0" y="0" width="' +
        actualWidth + '" height="' + actualHeight + '" color-interpolation-filters="sRGB">',
      '<feGaussianBlur stdDeviation="' + blur + '" /></filter>',
      '</defs>',
      '<rect width="100%" height="100%" fill="black"/>',
      '<rect width="100%" height="100%" rx="' + borderRadius + '" fill="url(#' + redGradId + ')"/>',
      '<rect width="100%" height="100%" rx="' + borderRadius + '" fill="url(#' +
        blueGradId + ')" style="mix-blend-mode:' + mixBlendMode + '"/>',
      '<rect x="' + edgeSize + '" y="' + edgeSize + '" width="' +
        (actualWidth - edgeSize * 2) + '" height="' + (actualHeight - edgeSize * 2) +
        '" rx="' + borderRadius + '" fill="hsl(0 0% ' + brightness + '% / ' + opacity +
        ')" filter="url(#' + softId + ')"/>',
      '</svg>'
    ].join('');
    return 'data:image/svg+xml,' + encodeURIComponent(svgContent);
  };

  const updateDisplacementMap = () => {
    mapUrlRef.current = shapeMapRef.current || generateDisplacementMap();
    feImageRef.current?.setAttribute('href', mapUrlRef.current);
  };

  useEffect(() => {
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      ref.current?.setAttribute('scale', String(distortionScale + offset));
      ref.current?.setAttribute('xChannelSelector', xChannel);
      ref.current?.setAttribute('yChannelSelector', yChannel);
    });
    gaussianBlurRef.current?.setAttribute('stdDeviation', String(displace));
  }, [
    boxSize, width, height, borderRadius, borderWidth, brightness, opacity,
    blur, displace, distortionScale, redOffset, greenOffset, blueOffset,
    xChannel, yChannel, mixBlendMode
  ]);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver(() => {
      const element = containerRef.current;
      if (element) setBoxSize(element.offsetWidth + 'x' + element.offsetHeight);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shape) return undefined;
    let alive = true;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => alive && setLoaded({ src: shape, image });
    image.onerror = () => alive && setLoaded({ src: shape, image: null });
    image.src = shape;
    return () => { alive = false; };
  }, [shape]);

  const shapeImage = shape && loaded.src === shape ? loaded.image : null;

  useEffect(() => {
    const element = containerRef.current;
    const w = element?.offsetWidth || 0;
    const h = element?.offsetHeight || 0;
    let map = '';
    let trace = null;

    if (shapeImage && w && h) {
      const ratio = Math.min(2, window.devicePixelRatio || 1, Math.sqrt(400000 / (w * h)));
      trace = traceRef.current;
      try {
        if (
          !trace || trace.image !== shapeImage || trace.width !== w ||
          trace.height !== h || trace.ratio !== ratio
        ) {
          trace = { image: shapeImage, width: w, height: h, ...traceShape(shapeImage, w, h, ratio) };
          traceRef.current = trace;
        }
        map = bendShape(
          trace,
          Math.min(w, h) * borderWidth * 0.5,
          Math.max(blur, 0.5),
          opacity,
          brightness / 100
        );
      } catch {
        trace = null;
        traceRef.current = null;
      }
    }

    shapeMapRef.current = map;
    updateDisplacementMap();
    if (shape && trace) setArt({ src: shape, box: trace.box, line: trace.line, glow: trace.glow });
    else if (shape && loaded.src === shape) setArt({ src: shape, failed: true });
  }, [shape, loaded, boxSize, borderWidth, blur, opacity, brightness]);

  useEffect(() => {
    setSvgSupported(supportsSVGFilters());
    setChecked(true);
  }, []);

  const webgl =
    checked &&
    refraction &&
    Boolean(backdrop) &&
    !webglFailed &&
    (renderer === 'webgl' || (renderer === 'auto' && !svgSupported));
  const refractive = !webgl && svgSupported && refraction;
  const frosted = !webgl && !refractive;

  useEffect(() => {
    if (!webgl) return undefined;
    const canvas = canvasRef.current;
    const element = containerRef.current;
    return startGlassRenderer({
      canvas,
      element,
      settingsRef,
      mapUrlRef,
      wakeRef: renderWakeRef,
      onFailure: () => setWebglFailed(true)
    });
  }, [webgl]);

  useEffect(() => {
    renderWakeRef.current?.();
  }, [backdrop, backdropVersion, boxSize, width, height, borderRadius, borderWidth, blur, opacity, brightness, mixBlendMode, shape, loaded, displace, saturation, distortionScale, redOffset, greenOffset, blueOffset, xChannel, yChannel, style, className]);

  function supportsSVGFilters() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;
    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    if (isWebkit || isFirefox) return false;
    const probe = document.createElement('div');
    probe.style.backdropFilter = 'url(#' + filterId + ')';
    return probe.style.backdropFilter !== '';
  }

  const outline = shape && art?.src === shape && !art.failed ? art : null;
  const maskUrl = outline
    ? 'url("' + outline.src.replace(/"/g, '%22').replace(/[\n\r]+/g, ' ') + '")'
    : '';
  const maskPlace = outline
    ? outline.box.x + 'px ' + outline.box.y + 'px / ' +
      outline.box.width + 'px ' + outline.box.height + 'px no-repeat'
    : '';
  const shapeStyle = outline
    ? {
        borderRadius: 0,
        boxShadow: 'none',
        WebkitMask: maskUrl + ' ' + maskPlace,
        mask: maskUrl + ' ' + maskPlace
      }
    : shape && art?.src !== shape
      ? { opacity: 0, transition: 'none' }
      : {};

  const containerStyle = {
    ...style,
    width: typeof width === 'number' ? width + 'px' : width,
    height: typeof height === 'number' ? height + 'px' : height,
    borderRadius: borderRadius + 'px',
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
    '--filter-id': 'url(#' + filterId + ')',
    ...shapeStyle
  };

  return (
    <div
      ref={containerRef}
      className={
        'glass-surface ' +
        (webgl ? 'glass-surface--webgl ' : refractive ? 'glass-surface--svg ' : 'glass-surface--fallback ') +
        className
      }
      style={containerStyle}
    >
      <svg className="glass-surface__filter" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" result="dispRed" />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
            <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" result="dispGreen" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" result="dispBlue" />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      {webgl && <canvas ref={canvasRef} className="glass-surface__canvas" aria-hidden="true" />}
      {webgl && <span className="glass-surface__frame" aria-hidden="true" />}
      {frosted && <span className="glass-surface__sheen" aria-hidden="true" />}
      {frosted && !outline && <span className="glass-surface__rim" aria-hidden="true" />}
      {outline && (
        <span
          className="glass-surface__glow"
          aria-hidden="true"
          style={{ WebkitMaskImage: 'url(' + outline.glow + ')', maskImage: 'url(' + outline.glow + ')' }}
        />
      )}
      {outline && (
        <span
          className="glass-surface__line"
          aria-hidden="true"
          style={{ WebkitMaskImage: 'url(' + outline.line + ')', maskImage: 'url(' + outline.line + ')' }}
        />
      )}
      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;