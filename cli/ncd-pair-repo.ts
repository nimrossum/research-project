#!/usr/bin/env node --experimental-strip-types

import { resolve } from "node:path";
import { computePairwiseNCD } from "@/compute.ts";
import { mkdir } from "node:fs/promises";
import { compressionAlgorithms } from "@/NCD/compress";
import { time } from "@/utils/misc";

declare global {
  var silent: boolean;
}

global.silent = false;

const targetDirectory = resolve(process.argv[2] ?? ".");
const parentDirectory = resolve(targetDirectory, "..");
const include = process.argv[3] ?? "**/*.*";
const compressor = process.argv[4] ?? Object.keys(compressionAlgorithms)[0]!;

if (!(compressor in compressionAlgorithms)) {
  throw new Error(`Invalid compression algorithm: ${compressor}`);
}

const directory = targetDirectory
  .split("\\")
  .filter((x) => x.length > 0)
  .pop();

console.log(`👉 Computing stats for ${directory}`);

const { paths, getEntry, getKeys } = await computePairwiseNCD(targetDirectory, {
  include: [include],
  compressor: compressor as keyof typeof compressionAlgorithms,
});

// Sort by accumulative distance
const sortedPaths = paths.sort((a, b) => {
  const aSum = paths.reduce(
    (acc, p) =>
      acc +
      (getEntry(a, p) ??
        (() => {
          throw new Error(
            "No value found for " +
              [a, p].join("|") +
              " keys: " +
              [...getKeys()].slice(0, 10).join(", ")
          );
        })()),
    0
  );
  const bSum = paths.reduce(
    (acc, p) =>
      acc +
      (getEntry(b, p) ??
        (() => {
          throw new Error("No value found for " + [b, p].join("|"));
        })()),
    0
  );
  return bSum - aSum;
});

const replaceString = parentDirectory;

const result = [
  ["", ...sortedPaths.map((p) => p.replace(replaceString, ""))],
  ...sortedPaths.map((a) => [
    a.replace(replaceString, ""),
    ...sortedPaths.map((b) => getEntry(a, b) ?? -1),
  ]),
];

try {
  await mkdir("data");
} catch (_error) {}

const convertToCsv = () => toCSV(result);

const csv = convertToCsv();

const writeCSVToDisk = () => Bun.write(`data/${directory}.csv`, csv);
await time(writeCSVToDisk)();

function toCSV(data: (string | number)[][]) {
  const rows = data.map((row) =>
    row
      .map((x) => (typeof x === "number" ? x.toString().replace(".", ",") : x))
      .join(";")
  );
  return rows.join("\n");
}
