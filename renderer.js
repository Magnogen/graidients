import { Chunkify } from './chunkify.js';

const raf = () => new Promise(requestAnimationFrame);

const toByte = (v) => {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

const clamp01 = (v) => {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
};

const mix = (a, b, t) => a + (b - a) * t;

const sampleRamp = (ramp, t) => {
  const points = Array.isArray(ramp) ? ramp : [];
  const x = clamp01(t);
  if (points.length === 0) return [x, x, x];

  if (x <= points[0].at) return points[0].rgb;
  const last = points[points.length - 1];
  if (x >= last.at) return last.rgb;

  for (let i = 1; i < points.length; i++) {
    const left = points[i - 1];
    const right = points[i];
    if (x > right.at) continue;
    const span = right.at - left.at;
    const localT = span <= 1e-6 ? 0 : (x - left.at) / span;
    return [
      mix(left.rgb[0], right.rgb[0], localT),
      mix(left.rgb[1], right.rgb[1], localT),
      mix(left.rgb[2], right.rgb[2], localT)
    ];
  }

  return last.rgb;
};

export async function runRenderer({ canvas, ctx, settings, getNetwork, state }) {
  let cacheChunkSize = -1;
  let cacheWidth = -1;
  let cacheHeight = -1;
  let chunks = [];

  while (true) {
    state.needsRefresh = false;
    const chunkSize = Math.min(canvas.width, 2 ** settings.chunk_size);

    if (
      cacheChunkSize !== chunkSize ||
      cacheWidth !== canvas.width ||
      cacheHeight !== canvas.height
    ) {
      cacheChunkSize = chunkSize;
      cacheWidth = canvas.width;
      cacheHeight = canvas.height;
      chunks = [...Chunkify(canvas.width, canvas.height).divide(chunkSize, chunkSize)];
    }

    render: for (const chunk of chunks) {
      const pixels = ctx.getImageData(chunk.x, chunk.y, chunk.width, chunk.height);
      const coords = [...chunk];
      shuffle(coords);

      for (const { x, y, localX, localY } of coords) {
        if (state.restartRender) break render;

        let X = settings.scale * (x / (canvas.width - 1) - 0.5);
        let Y = settings.scale * (y / (canvas.height - 1) - 0.5);
        const I = 4 * (localX + localY * chunk.width);
        const paletteMode = settings.render_mode === 'palette';
        const warpXIndex = paletteMode ? 1 : 3;
        const warpYIndex = paletteMode ? 2 : 4;

        let col = getNetwork().compute(X, Y);
        if (settings.domain_warping) {
          X += settings.warping_amount * (col[warpXIndex] ?? 0);
          Y += settings.warping_amount * (col[warpYIndex] ?? 0);
          col = getNetwork().compute(X, Y);
        }

        const [r, g, b] = paletteMode
          ? sampleRamp(settings.palette_ramp, col[0] ?? 0)
          : [col[0], col[1], col[2]];
        pixels.data[I + 0] = toByte(r);
        pixels.data[I + 1] = toByte(g);
        pixels.data[I + 2] = toByte(b);
        pixels.data[I + 3] = 255;

      }

      ctx.putImageData(pixels, chunk.x, chunk.y);
      await raf();
    }

    while (!state.needsRefresh) await raf();
    state.restartRender = false;
  }
}
