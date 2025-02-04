import { compress as zstd } from "@mongodb-js/zstd";
import { gzipSync } from "bun";

const compressionAlgorithms = {
  zstd: (data: Buffer) => zstd(data, 3),
  zlib: (data: Buffer) => gzipSync(data, {
    level: 3,
    memLevel: 9,
    library: "zlib",
  }),
  libdeflate: (data: Buffer) => gzipSync(data, {
    level: 3,
    library: "libdeflate",
  })
};

export function compress(
  data: Buffer,
  method: keyof typeof compressionAlgorithms = "zstd"
) {
  return compressionAlgorithms[method](data);
}
