import { computeNCDForRepositoryFiles } from "@/compute.ts";
import { calculateNormalizedCompressionDistances } from "@/NCD/ncd.ts";
import { describe, expect, it } from "bun:test";

describe("NCD", () => {
  it("should calculate the normalized compression distance for each file", async () => {
    expect(async () => {
      const filePaths = ["./compute.ts", "./NCD/ncd.ts", "./NCD/compress.ts"];
      const result = await calculateNormalizedCompressionDistances(
        "..",
        filePaths
      );
      console.log(result);
    }).not.toThrow();
  });
});
