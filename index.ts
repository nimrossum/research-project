import { normalize } from "node:path";
import { computeNCRForRepositoryFiles } from "./compute.ts";

const outputFormatFns = {
  table: console.table,
  json: (data: any) => console.log(JSON.stringify(data, null, 2)),
};

type OutputFormat = keyof typeof outputFormatFns;

const targetDirectory = process.argv[2] ?? ".";
// Input: folder
const targetDirectoryNormalized = normalize(targetDirectory);
const format = process.argv[3] ?? "table";

console.log(`Computing stats for ${targetDirectory}`);
const data = await computeNCRForRepositoryFiles(targetDirectoryNormalized);

const outputFormats = Object.keys(outputFormatFns);
if (!outputFormats.includes(format)) {
  console.error(`Invalid format: ${format}`);
  console.error(`Valid formats: ${outputFormats.join(", ")}`);
}

outputFormatFns[format as OutputFormat](data);
