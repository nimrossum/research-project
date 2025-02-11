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
}

else if (format === "json") {
  const data = JSON.stringify(Object.fromEntries(result.getEntries()));
  Bun.write(`web/static/data/${directory}.json`, data);
}
