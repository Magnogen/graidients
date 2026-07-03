import { Chunkify } from './chunkify.js';

const raf = () => new Promise(requestAnimationFrame);

const toByte = (v) => {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
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

        let col = getNetwork().compute(X, Y);
        if (settings.domain_warping) {
          X += settings.warping_amount * col[3];
          Y += settings.warping_amount * col[4];
          col = getNetwork().compute(X, Y);
        }

        const [r, g, b] = col;
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
