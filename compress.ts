
export function zipRatio(data: Buffer) {
  const size = data.length;
  const compressed = Bun.gzipSync(data);
  const compressedSize = compressed.length;
  return { size, compressedSize, ratio: Math.min(compressedSize / size, 1) };
}
