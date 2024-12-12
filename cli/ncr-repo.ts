import { normalize } from "node:path";
import { computeNCRForRepositoryFiles } from "../compute.ts";

const outputFormatFns = {
  table: console.table,
  json: (data: any) => console.log(JSON.stringify(data, null, 2)),
};

type OutputFormat = keyof typeof outputFormatFns;

const targetDirectory = process.argv[2] ?? ".";
// Input: folder
const targetDirectoryNormalized = normalize(targetDirectory);
const format = process.argv[3] ?? "table";

const outputFormats = Object.keys(outputFormatFns);
if (!outputFormats.includes(format)) {
  console.error(`Invalid format: ${format}`);
  console.error(`Valid formats: ${outputFormats.join(", ")}`);
  process.exit(1);
}

console.log(`Computing stats for ${targetDirectory}`);
const { AR, _AR_, NCR_As: normalizedCompressionRatios } = await computeNCRForRepositoryFiles(
  targetDirectoryNormalized
);

const data = normalizedCompressionRatios.sort((a, b) => +a.A - +b.A);

console.log(` AR : ${AR.toLocaleString()} bytes`);
console.log(`|AR|: ${_AR_.toLocaleString()} bytes`);
console.log(`Compression ratio for repository: ${_AR_ / AR}`);

outputFormatFns[format as OutputFormat](data);
