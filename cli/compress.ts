#!/usr/bin/env bun

import { readFileSync } from "fs";
import { compress } from "@/utils/compress";

if (process.stdin.isTTY) {
  console.log("Pipe something into this command to measure compression ratio");
  console.log("cat file.txt | npm run compress");
  process.exit();
}

const inputBuffer = readFileSync(process.stdin.fd);

const compressedBuffer = await compress(inputBuffer);
console.log(`Input Buffer Length: ${inputBuffer.length}`);
console.log(`Compressed Buffer Length: ${compressedBuffer.length}`);
console.log(
  "Compression Ratio: ",
  compressedBuffer.length / inputBuffer.length
);

const NCD = (_AR_ - Math.min(_A_, _R_)) / Math.max(_A_, _R_);
