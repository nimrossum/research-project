import { argv, write } from "bun";
import { normalize } from "node:path";
import { compute } from "./compute";

console.log("Hello via Bun!");

// Input: folder
const targetDirectory = normalize(argv[2] ?? ".");


const data = await compute(targetDirectory);
// Report back tree with compression rates in terminal
console.table(data);

write("data.json", JSON.stringify(data, null, 2));
