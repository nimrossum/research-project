import { compress as zstd } from "@mongodb-js/zstd";

const compressionAlgorithms = {
  zstd: zstd,
};

export function compress(
  data: Buffer,
  method: keyof typeof compressionAlgorithms
) {
  return compressionAlgorithms[method](data);
}
