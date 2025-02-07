import { compress as zstd } from "@mongodb-js/zstd";

export const compressionAlgorithms = {
  zstd: (data: Buffer) => zstd(data, 3),
} as const;

export function compress(
  data: Buffer,
  method: keyof typeof compressionAlgorithms = "zstd"
): Promise<Buffer> {
  return compressionAlgorithms[method](data);
}
