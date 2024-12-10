import { writeFile } from "fs/promises";
import { normalize } from "node:path";
import { compute } from "./compute.ts";

// Input: folder
const targetDirectory = normalize(process.argv[2] ?? ".");

const data = await compute(targetDirectory);
// Report back tree with compression rates in terminal
console.table(data);

await writeFile("data.json", JSON.stringify(data, null, 2));
