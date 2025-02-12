#!/usr/bin/env node --experimental-strip-types

import { resolve } from "node:path";
import { computePairwiseNCD } from "@/compute.ts";
import { mkdir } from "node:fs/promises";
import { compressionAlgorithms } from "@/utils/compress";
import { time } from "@/utils/misc";
import { to2DCSV } from "@/utils/file";

declare global {
  var silent: boolean;
}

// global.silent = true;

const formats = ["json", "csv"];

const targetDirectory = resolve(process.argv[2] ?? ".");
const format = process.argv[3] ?? "json";
const parentDirectory = resolve(targetDirectory, "..");
const include = process.argv[4] ?? "**/*.*";
const exclude = process.argv[5];

if (!formats.includes(format)) {
  throw new Error(
    `Invalid format: ${format}, must be one of ${formats.join(", ")}`
  );
}

const directory = targetDirectory
  .split("\\")
  .filter((x) => x.length > 0)
  .pop();

console.log(`👉 Computing stats for ${directory}`);

const result = await computePairwiseNCD(targetDirectory, {
  include: [include],
  ...(exclude ? { exclude: [exclude] } : {}),
});

export type NCDJSONResult = {
  paths: string[];
  pairMap: Record<string, number>;
  pairMapNormalized: Record<string, number>;
  accumulatedDistanceMap: Record<string, number>;
  parentDirectoryMap: Record<string, string>;
  minDistance: number;
  maxDistance: number;
  totalAccumulatedDistance: number;
};

// Sort by accumulative distance
const sortedPaths = result.paths.sort((a, b) => {
  const aSum = result.paths.reduce(
    (acc, p) =>
      acc +
      (result.getEntry(a, p) ??
        (() => {
          throw new Error(
            "No value found for " +
              [a, p].join("|") +
              " keys: " +
              [...result.getKeys()].slice(0, 10).join(", ")
          );
        })()),
    0
  );
  const bSum = result.paths.reduce(
    (acc, p) =>
      acc +
      (result.getEntry(b, p) ??
        (() => {
          throw new Error("No value found for " + [b, p].join("|"));
        })()),
    0
  );
  return bSum - aSum;
});

const parentDirectoryMap = Object.fromEntries(
  sortedPaths.map((p) => [
    p,
    resolve(p, "..").replace("C:\\Users\\jonas\\p\\", ""),
  ])
);

try {
  await mkdir("data");
} catch (_error) {}

const replaceString = parentDirectory;

if (format === "csv") {
  const csvResult = [
    ["", ...sortedPaths.map((p) => p.replace(replaceString, ""))],
    ...sortedPaths.map((a) => [
      a.replace(replaceString, ""),
      ...sortedPaths.map((b) => result.getEntry(a, b) ?? -1),
    ]),
  ];

  const convertToCsv = () => to2DCSV(csvResult);

  const csv = convertToCsv();

  const writeCSVToDisk = () => Bun.write(`data/${directory}.csv`, csv);
  await time(writeCSVToDisk)();
} else if (format === "json") {
  const accumulatedDistanceMap = Object.fromEntries(
    sortedPaths.map(
      (a) =>
        [
          a,
          result.paths.reduce(
            (acc, p) =>
              acc +
              (result.getEntry(a, p) ??
                (() => {
                  throw new Error("No value found for " + [a, p].join("|"));
                })()),
            0
          ),
        ] as const
    )
  );

  const accumulatedDistanceSum = Object.values(accumulatedDistanceMap).reduce(
    (acc, x) => acc + x,
    0
  );

  const accumulatedDistanceSumMin = Math.min(
    ...Object.values(accumulatedDistanceMap)
  );

  const accumulatedDistanceSumMax = Math.max(
    ...Object.values(accumulatedDistanceMap)
  );

  for (const [k, v] of Object.entries(accumulatedDistanceMap)) {
    accumulatedDistanceMap[k] =
      (v - accumulatedDistanceSumMin) /
      (accumulatedDistanceSumMax - accumulatedDistanceSumMin);
  }

  const entries = result.getEntries();
  let min = Infinity;
  let max = -Infinity;

  for (const value of result.getValues()) {
    if (value < min) {
      min = value;
    }
    if (value > max) {
      max = value;
    }
  }

  const data = JSON.stringify({
    paths: sortedPaths,
    pairMap: Object.fromEntries(entries),
    pairMapNormalized: Object.fromEntries(
      entries.map(([k, v]) => [k, (v - min) / (max - min)])
    ),
    accumulatedDistanceMap: accumulatedDistanceMap,
    parentDirectoryMap: parentDirectoryMap,
    totalAccumulatedDistance: accumulatedDistanceSum,
    minDistance: min,
    maxDistance: max,
  } satisfies NCDJSONResult);
  Bun.write(`web/static/data/${directory}.json`, data);
}
