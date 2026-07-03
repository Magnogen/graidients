export function Chunkify(width, height, startX = 0, startY = 0) {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new TypeError('Chunkify width and height must be finite numbers.');
  }

  return {
    x: startX,
    y: startY,
    width,
    height,
    *[Symbol.iterator]() {
      for (let y = 0; y < height; y++) 
      for (let x = 0; x < width; x++) {
        yield {
          x: startX + x,
          y: startY + y,
          localX: x,
          localY: y
        };
      }
    },
    *divide(chunkWidth, chunkHeight = chunkWidth) {
      if (!Number.isFinite(chunkWidth) || !Number.isFinite(chunkHeight)) {
        throw new TypeError('Chunk dimensions must be finite numbers.');
      }
      if (chunkWidth <= 0 || chunkHeight <= 0) {
        throw new RangeError('Chunk dimensions must be greater than 0.');
      }

      const maxX = startX + width;
      const maxY = startY + height;

      for (let chunkY = startY; chunkY < maxY; chunkY += chunkHeight) {
        for (let chunkX = startX; chunkX < maxX; chunkX += chunkWidth) {
          const w = Math.min(chunkWidth, maxX - chunkX);
          const h = Math.min(chunkHeight, maxY - chunkY);

          yield Chunkify(w, h, chunkX, chunkY);
        }
      }
    }
  };
}
