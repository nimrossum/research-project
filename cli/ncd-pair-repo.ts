#!/usr/bin/env node --experimental-strip-types

import { normalize } from "node:path";
import { computePairwiseNCD } from "@/compute.ts";
import { mkdir } from "node:fs/promises";

declare global {
  var silent: boolean;
}

global.silent = false;

const targetDirectory = process.argv[2] ?? ".";
const include = process.argv[3] ?? "**/*.*";
const compressor = process.argv[4] ?? undefined;
// Input: folder
const targetDirectoryNormalized = normalize(targetDirectory);

const directory = targetDirectoryNormalized
  .split("\\")
  .filter((x) => x.length > 0)
  .pop();

console.log(`👉 Computing stats for ${directory}`);

const { paths, dataMap } = await computePairwiseNCD(
  targetDirectoryNormalized,
  {
    include: [include],
    compressor,
  }
);


// Sort by accumulative distance
const sortedPaths = paths.sort((a, b) => {
  const aSum = paths.reduce(
    (acc, p) =>
      acc +
      (dataMap.get([a, p].join("|")) ??
        (() => {
          throw new Error("No value found");
        })()),
    0
  );
  const bSum = paths.reduce(
    (acc, p) =>
      acc +
      (dataMap.get([b, p].join("|")) ??
        (() => {
          throw new Error("No value found");
        })()),
    0
  );
  return bSum - aSum;
});

const replaceString = `C:\\Users\\jonas\\p\\${directory}\\`;
const result = [
  ["", ...sortedPaths.map((p) => p.replace(replaceString, ""))],
  ...sortedPaths.map((a) => [
    a.replace(replaceString, ""),
    ...sortedPaths.map((b) => dataMap.get([a, b].join("|")) ?? -1),
  ]),
];

try {
  await mkdir("data");
} catch (_error) {}
Bun.write(`data/${directory}.csv`, toCSV(result));

function toCSV(data: (string | number)[][]) {
  const rows = data.map((row) =>
    row
      .map((x) => (typeof x === "number" ? x.toString().replace(".", ",") : x))
      .join(";")
  );
  return rows.join("\n");
}

// Generate "cartesian product" table of paths

/*
  A B C D E F
A 0 1 2 3 4 5
B 1 0 1 2 3 4
C 2 1 0 1 2 3
D 3 2 1 0 1 2
*/
