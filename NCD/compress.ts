import { compress as zstd } from "@mongodb-js/zstd";
import { gzipSync } from "bun";

export const compressionAlgorithms = {
  zstd: (data: Buffer) => zstd(data, 3),
  // zlib: (data: Buffer) =>
  //   Promise.resolve(
  //     gzipSync(data, {
  //       level: 3,
  //       memLevel: 9,
  //       library: "zlib",
  //     })
  //   ),
  // libdeflate: (data: Buffer) =>
  //   Promise.resolve(
  //     gzipSync(data, {
  //       level: 3,
  //       library: "libdeflate",
  //     })
  //   ),
} as const;

export function compress(
  data: Buffer,
  method: keyof typeof compressionAlgorithms = "zstd"
): Promise<Buffer> {
  return compressionAlgorithms[method](data);
}
