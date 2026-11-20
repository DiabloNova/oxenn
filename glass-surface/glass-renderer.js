const VERTEX_SHADER = [
  '#version 300 es',
  'in vec2 aPosition;',
  'void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }'
].join('\n');

const FRAGMENT_SHADER = [
  '#version 300 es',
  'precision highp float;',
  'uniform sampler2D uBackdrop;',
  'uniform sampler2D uMap;',
  'uniform vec2 uCanvas;',
  'uniform vec2 uSize;',
  'uniform vec2 uOrigin;',
  'uniform vec2 uStep;',
  'uniform vec3 uScale;',
  'uniform ivec2 uChannel;',
  'uniform float uSpread;',
  'uniform float uLod;',
  'uniform float uSaturation;',
  'out vec4 outColor;',
  'vec4 bend(vec2 p) {',
  '  vec4 map = texture(uMap, clamp(p / uSize, 0.0, 1.0));',
  '  vec2 shift = vec2(map[uChannel.x], map[uChannel.y]) - 0.5;',
  '  vec2 base = uOrigin + p * uStep;',
  '  vec4 red = textureLod(uBackdrop, base + shift * uScale.r * uStep, uLod);',
  '  vec4 green = textureLod(uBackdrop, base + shift * uScale.g * uStep, uLod);',
  '  vec4 blue = textureLod(uBackdrop, base + shift * uScale.b * uStep, uLod);',
  '  return vec4(red.r, green.g, blue.b, (red.a + green.a + blue.a) / 3.0);',
  '}',
  'void main() {',
  '  vec2 p = vec2(gl_FragCoord.x, uCanvas.y - gl_FragCoord.y) / uCanvas * uSize;',
  '  vec4 color = vec4(0.0);',
  '  if (uSpread < 0.05) { color = bend(p); } else {',
  '    float total = 0.0;',
  '    for (int j = -2; j <= 2; j++) {',
  '      for (int i = -2; i <= 2; i++) {',
  '        vec2 offset = vec2(float(i), float(j)) * uSpread * 0.8;',
  '        float weight = exp(-dot(offset, offset) / (2.0 * uSpread * uSpread));',
  '        color += bend(p + offset) * weight;',
  '        total += weight;',
  '      }',
  '    }',
  '    color /= total;',
  '  }',
  '  vec3 rgb = color.a > 0.0 ? color.rgb / color.a : vec3(0.0);',
  '  float s = uSaturation;',
  '  mat3 tone = mat3(',
  '    0.213 + 0.787 * s, 0.213 - 0.213 * s, 0.213 - 0.213 * s,',
  '    0.715 - 0.715 * s, 0.715 + 0.285 * s, 0.715 - 0.715 * s,',
  '    0.072 - 0.072 * s, 0.072 - 0.072 * s, 0.072 + 0.928 * s',
  '  );',
  '  rgb = clamp(tone * rgb, 0.0, 1.0);',
  '  outColor = vec4(rgb * color.a, color.a);',
  '}'
].join('\n');

const CHANNELS = { R: 0, G: 1, B: 2, A: 3 };
const UNIFORMS = [
  'uBackdrop', 'uMap', 'uCanvas', 'uSize', 'uOrigin', 'uStep', 'uScale',
  'uChannel', 'uSpread', 'uLod', 'uSaturation'
];

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const createProgram = (gl) => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, 'aPosition');
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
};

const resolveBackdrop = (backdrop) => {
  if (!backdrop) return null;
  const node = typeof backdrop === 'object' && 'current' in backdrop ? backdrop.current : backdrop;
  if (
    typeof HTMLImageElement !== 'undefined' && node instanceof HTMLImageElement ||
    typeof HTMLVideoElement !== 'undefined' && node instanceof HTMLVideoElement ||
    typeof HTMLCanvasElement !== 'undefined' && node instanceof HTMLCanvasElement
  ) return node;
  return null;
};

const sourceSize = (node) => {
  if (node instanceof HTMLImageElement) return [node.naturalWidth, node.naturalHeight];
  if (node instanceof HTMLVideoElement) return [node.videoWidth, node.videoHeight];
  return [node.width, node.height];
};

const placeAxis = (value, free) => {
  if (!value) return free / 2;
  if (value.endsWith('%')) return (parseFloat(value) / 100) * free;
  const px = parseFloat(value);
  return Number.isFinite(px) ? px : free / 2;
};

const contentBox = (node) => {
  const rect = node.getBoundingClientRect();
  const [naturalWidth, naturalHeight] = sourceSize(node);
  const style = getComputedStyle(node);
  const fit = style.objectFit || 'fill';
  if (!naturalWidth || !naturalHeight || fit === 'fill') {
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  }
  const contain = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
  const cover = Math.max(rect.width / naturalWidth, rect.height / naturalHeight);
  const scale = fit === 'cover' ? cover : fit === 'contain' ? contain : fit === 'none' ? 1 : Math.min(1, contain);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const [px, py] = (style.objectPosition || '50% 50%').split(' ');
  return {
    x: rect.left + placeAxis(px, rect.width - width),
    y: rect.top + placeAxis(py ?? px, rect.height - height),
    width,
    height
  };
};

export function startGlassRenderer({ canvas, element, settingsRef, mapUrlRef, wakeRef, onFailure }) {
  const gl = canvas?.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false
  });

  if (!canvas || !element || !gl) {
    onFailure();
    return undefined;
  }

  const program = createProgram(gl);
  if (!program) {
    onFailure();
    return undefined;
  }

  const uniforms = {};
  UNIFORMS.forEach((name) => { uniforms[name] = gl.getUniformLocation(program, name); });

  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) {
    if (vao) gl.deleteVertexArray(vao);
    if (buffer) gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    onFailure();
    return undefined;
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  const makeTexture = () => {
    const texture = gl.createTexture();
    if (!texture) return null;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  };

  const backdropTexture = makeTexture();
  const mapTexture = makeTexture();
  const mapCanvas = document.createElement('canvas');
  const mapContext = mapCanvas.getContext('2d');

  const disposeResources = () => {
    if (backdropTexture) gl.deleteTexture(backdropTexture);
    if (mapTexture) gl.deleteTexture(mapTexture);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
  };

  if (!backdropTexture || !mapTexture || !mapContext) {
    disposeResources();
    onFailure();
    return undefined;
  }

  const picture = { node: null, key: '', width: 0, height: 0, mipmapped: false, ready: false };
  const map = { url: '', ready: false };
  let frame = 0;
  let visible = true;
  let drawn = '';
  let disposed = false;

  const loadMap = (url) => {
    map.url = url;
    map.ready = false;
    const image = new Image();
    image.onload = () => {
      if (disposed || map.url !== url) return;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      mapCanvas.width = Math.max(1, Math.round(element.offsetWidth * ratio));
      mapCanvas.height = Math.max(1, Math.round(element.offsetHeight * ratio));
      mapContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
      mapContext.drawImage(image, 0, 0, mapCanvas.width, mapCanvas.height);
      gl.bindTexture(gl.TEXTURE_2D, mapTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mapCanvas);
      map.ready = true;
      drawn = '';
      wake();
    };
    image.onerror = () => {
      if (!disposed && map.url === url) onFailure();
    };
    image.src = url;
  };

  const assertNoGlError = (operation) => {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      throw new Error(operation + ' failed with WebGL error ' + error);
    }
  };

  const upload = (node) => {
    const still = node instanceof HTMLImageElement;
    gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, node);
    assertNoGlError('Backdrop texture upload');
    if (still) {
      gl.generateMipmap(gl.TEXTURE_2D);
      assertNoGlError('Backdrop mipmap generation');
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, still ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    assertNoGlError('Backdrop texture configuration');
    [picture.width, picture.height] = sourceSize(node);
    picture.mipmapped = still;
    picture.ready = true;
  };

  const tick = () => {
    frame = 0;
    if (disposed || !visible || document.hidden) return;

    const settings = settingsRef.current;
    if (!settings) return;
    if (mapUrlRef.current && mapUrlRef.current !== map.url) loadMap(mapUrlRef.current);

    const node = syncBackdropNode();
    if (!node) return;
    const isVideo = node instanceof HTMLVideoElement;
    if (isVideo) frame = requestAnimationFrame(tick);
    let key = '';
    if (node instanceof HTMLImageElement) {
      key = node.complete && node.naturalWidth ? node.currentSrc || node.src : '';
    } else if (node instanceof HTMLVideoElement) {
      key = node.readyState >= 2 ? node.currentSrc + '|' + node.currentTime : '';
    } else {
      // Canvas pixels are treated as static until the caller changes backdropVersion.
      key = node.width + 'x' + node.height + '|' + String(settings.backdropVersion ?? '');
    }

    if (key && (node !== picture.node || key !== picture.key)) {
      try {
        upload(node);
      } catch {
        onFailure();
        return;
      }
      picture.node = node;
      picture.key = key;
      drawn = '';
    }

    if (!picture.ready || !map.ready) return;
    const layoutWidth = element.offsetWidth;
    const layoutHeight = element.offsetHeight;
    if (!layoutWidth || !layoutHeight) return;

    const box = element.getBoundingClientRect();
    const content = contentBox(node);
    if (!content.width || !content.height) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(layoutWidth * ratio));
    const height = Math.max(1, Math.round(layoutHeight * ratio));
    const signature = [
      box.left, box.top, box.width, box.height,
      content.x, content.y, content.width, content.height,
      width, height, picture.key, map.url,
      settings.displace, settings.saturation, settings.distortionScale,
      settings.redOffset, settings.greenOffset, settings.blueOffset,
      settings.xChannel, settings.yChannel
    ].join('|');
    if (signature === drawn) return;
    drawn = signature;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const scaleX = box.width / layoutWidth;
    const scaleY = box.height / layoutHeight;
    const texelsPerPixel = (picture.width / content.width) * (scaleX / ratio);
    const spreadTexels = (picture.width / content.width) * scaleX * Math.max(0, settings.displace);
    const lod = picture.mipmapped
      ? Math.max(0, Math.log2(Math.max(texelsPerPixel, spreadTexels * 0.5, 0.000001)))
      : 0;

    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backdropTexture);
    gl.uniform1i(uniforms.uBackdrop, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, mapTexture);
    gl.uniform1i(uniforms.uMap, 1);
    gl.uniform2f(uniforms.uCanvas, width, height);
    gl.uniform2f(uniforms.uSize, layoutWidth, layoutHeight);
    gl.uniform2f(uniforms.uOrigin, (box.left - content.x) / content.width, (box.top - content.y) / content.height);
    gl.uniform2f(uniforms.uStep, scaleX / content.width, scaleY / content.height);
    gl.uniform3f(
      uniforms.uScale,
      settings.distortionScale + settings.redOffset,
      settings.distortionScale + settings.greenOffset,
      settings.distortionScale + settings.blueOffset
    );
    gl.uniform2i(
      uniforms.uChannel,
      CHANNELS[settings.xChannel] ?? 0,
      CHANNELS[settings.yChannel] ?? 1
    );
    gl.uniform1f(uniforms.uSpread, Math.max(0, settings.displace));
    gl.uniform1f(uniforms.uLod, lod);
    gl.uniform1f(uniforms.uSaturation, settings.saturation);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const wake = () => {
    if (!frame && visible && !document.hidden && !disposed) frame = requestAnimationFrame(tick);
  };
  const onBackdropReady = () => {
    picture.ready = false;
    picture.key = '';
    drawn = '';
    wake();
  };
  const onBackdropFailure = () => onFailure();
  const resizeObserver = new ResizeObserver(wake);
  resizeObserver.observe(element);
  let backdropNode = null;
  const backdropObserver = new MutationObserver(() => {
    syncBackdropNode();
    wake();
  });
  const unbindBackdrop = (node) => {
    if (node instanceof HTMLImageElement) {
      node.removeEventListener('load', onBackdropReady);
      node.removeEventListener('error', onBackdropFailure);
    } else if (node instanceof HTMLVideoElement) {
      node.removeEventListener('loadeddata', onBackdropReady);
      node.removeEventListener('playing', wake);
      node.removeEventListener('seeked', wake);
    }
    if (node instanceof Element) resizeObserver.unobserve(node);
  };
  const syncBackdropNode = () => {
    const nextNode = resolveBackdrop(settingsRef.current?.backdrop);
    if (nextNode === backdropNode) return nextNode;
    if (backdropNode) unbindBackdrop(backdropNode);
    backdropObserver.disconnect();
    backdropNode = nextNode;
    picture.node = null;
    picture.key = '';
    picture.ready = false;
    drawn = '';
    if (backdropNode instanceof HTMLImageElement) {
      backdropNode.addEventListener('load', onBackdropReady);
      backdropNode.addEventListener('error', onBackdropFailure);
    } else if (backdropNode instanceof HTMLVideoElement) {
      backdropNode.addEventListener('loadeddata', onBackdropReady);
      backdropNode.addEventListener('playing', wake);
      backdropNode.addEventListener('seeked', wake);
    }
    if (backdropNode instanceof Element) {
      resizeObserver.observe(backdropNode);
      if (!element.contains(backdropNode)) {
        backdropObserver.observe(backdropNode, { attributes: true, attributeFilter: ['class', 'style'] });
      }
    }
    return backdropNode;
  };
  syncBackdropNode();
  const onLost = (event) => {
    event.preventDefault();
    onFailure();
  };
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    wake();
  });
  intersection.observe(element);
  // Observe only this surface subtree. ResizeObserver and the window listeners
  // below cover geometry changes outside it; an external backdrop is observed
  // separately by backdropObserver.
  const domObserver = new MutationObserver(() => {
    syncBackdropNode();
    wake();
  });
  domObserver.observe(element, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('resize', wake);
  window.addEventListener('scroll', wake, true);
  canvas.addEventListener('webglcontextlost', onLost);
  if (wakeRef) wakeRef.current = wake;
  wake();

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    intersection.disconnect();
    domObserver.disconnect();
    backdropObserver.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', wake);
    window.removeEventListener('resize', wake);
    window.removeEventListener('scroll', wake, true);
    if (backdropNode) unbindBackdrop(backdropNode);
    if (wakeRef?.current === wake) wakeRef.current = null;
    canvas.removeEventListener('webglcontextlost', onLost);
    disposeResources();
  };
}