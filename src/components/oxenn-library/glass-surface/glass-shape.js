const FAR = 1e20;

const distanceLine = (f, d, v, z, n) => {
  let k = 0;
  v[0] = 0;
  z[0] = -FAR;
  z[1] = FAR;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k] && k > 0) {
      k--;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = FAR;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
};

const distanceGrid = (grid, w, h) => {
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = grid[y * w + x];
    distanceLine(f, d, v, z, h);
    for (let y = 0; y < h; y++) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = grid[y * w + x];
    distanceLine(f, d, v, z, w);
    for (let x = 0; x < w; x++) grid[y * w + x] = d[x];
  }
};

const blurLine = (src, dst, offset, stride, n, radius) => {
  const scale = 1 / (2 * radius + 1);
  let sum = src[offset] * (radius + 1);
  for (let i = 1; i <= radius; i++) sum += src[offset + Math.min(i, n - 1) * stride];
  for (let i = 0; i < n; i++) {
    dst[offset + i * stride] = sum * scale;
    sum += src[offset + Math.min(i + radius + 1, n - 1) * stride] -
      src[offset + Math.max(i - radius, 0) * stride];
  }
};

const blurGrid = (grid, w, h, radius) => {
  const temp = new Float32Array(w * h);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) blurLine(grid, temp, y * w, 1, w, radius);
    for (let x = 0; x < w; x++) blurLine(temp, grid, x, w, h, radius);
  }
};

const settle = (x) => 1 / (1 + Math.exp(-1.702 * x));

const paint = (w, h, fill) => {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable');
  const image = context.createImageData(w, h);
  fill(image.data);
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
};

const shade = (depth, w, h, falloff) => paint(w, h, (data) => {
  data.fill(255);
  for (let i = 0; i < w * h; i++) data[i * 4 + 3] = 255 * (1 - falloff(depth[i]));
});

export const traceShape = (image, width, height, ratio) => {
  const naturalWidth = image.naturalWidth || width;
  const naturalHeight = image.naturalHeight || height;
  const fit = Math.min(width / naturalWidth, height / naturalHeight);
  const box = {
    x: (width - naturalWidth * fit) / 2,
    y: (height - naturalHeight * fit) / 2,
    width: naturalWidth * fit,
    height: naturalHeight * fit
  };
  const w = Math.max(2, Math.round(width * ratio));
  const h = Math.max(2, Math.round(height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D context is unavailable');
  context.drawImage(image, box.x * ratio, box.y * ratio, box.width * ratio, box.height * ratio);
  const pixels = context.getImageData(0, 0, w, h).data;
  const outside = new Float32Array(w * h);
  const inside = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const edge = 0.5 - pixels[i * 4 + 3] / 255;
    outside[i] = edge >= 0.5 ? FAR : Math.max(edge, 0) ** 2;
    inside[i] = edge <= -0.5 ? FAR : Math.min(edge, 0) ** 2;
  }
  distanceGrid(outside, w, h);
  distanceGrid(inside, w, h);
  const depth = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) depth[i] = (Math.sqrt(inside[i]) - Math.sqrt(outside[i])) / ratio;
  return {
    box, depth, w, h, ratio,
    line: shade(depth, w, h, (t) => settle(t - 1)),
    glow: shade(depth, w, h, (t) => settle((t - 4) / 5))
  };
};

export const bendShape = (trace, edge, softness, calm, level) => {
  const { depth, w, h, ratio } = trace;
  const reach = edge + softness * 2;
  const field = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) field[i] = Math.min(Math.max(depth[i], -6), reach);
  blurGrid(field, w, h, Math.max(1, Math.round(Math.max(1.5, softness * 0.35) * ratio)));
  return paint(w, h, (data) => {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const dx = field[i + (x < w - 1 ? 1 : 0)] - field[i - (x > 0 ? 1 : 0)];
        const dy = field[i + (y < h - 1 ? w : 0)] - field[i - (y > 0 ? w : 0)];
        const still = calm * settle((depth[i] - edge) / softness);
        const bend = (1 - still) * ratio * 0.25;
        const shift = still * (level - 0.5);
        data[i * 4] = 255 * (0.5 + dx * bend + shift);
        data[i * 4 + 1] = 255 * (0.5 + dy * bend + shift);
        data[i * 4 + 2] = 255 * (0.5 + shift);
        data[i * 4 + 3] = 255;
      }
    }
  });
};