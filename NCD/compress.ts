import { compress as zstd } from "@mongodb-js/zstd";

const compressionAlgorithms = {
  zstd
};

export function compress(
  data: Buffer,
  method: keyof typeof compressionAlgorithms = "zstd"
) {
  return compressionAlgorithms[method](data);
}
