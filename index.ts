import Bun, { $ } from "bun";
import { readdir } from "fs/promises";

console.log("Hello via Bun!");

type Method = keyof typeof methods;
const methods = {
  rd: async () => await readdir(targetDirectory, { recursive: true }),
  ls: async () => (await $`ls -R ${targetDirectory}`.text()).trim().split("\n"),
} as const

const method = Bun.argv[2];
const targetDirectory = Bun.argv[3] ?? ".";
// Input: folder

if (method === undefined) {
  console.error(`Please provide method, got ${method}`);
  process.exit(1);
}

console.log(`Method: ${method}`);

const methodFn = methods[method as Method];

if (methodFn === undefined) {
  console.error(`Invalid method, got ${method}`);
  process.exit(1);
}

// 1. LS file tree recursively
const startTime = performance.now();
const files = await methodFn();

const length = files.length;
console.log(`Found ${length} files`);

const stopTime = performance.now();

// console.log(files.join("\n"));
console.log(`Time taken: ${stopTime - startTime}ms`);

// 2. Read file contents
// 3. Compress and calculate compression rate
// 4. Report back tree with compression rates in terminal
