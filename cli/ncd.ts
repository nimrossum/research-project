#!/usr/bin/env bun

// This file reads a list of files from the command line and concatenates them

import { compress } from "@/NCD/compress";
import { readFileSync } from "fs";

const files = process.argv.slice(2).flatMap(f => f.split(" "))

const buffers = files.map(f => readFileSync(f))

const concatenatedBuffer = Buffer.concat(buffers)

const xy = (await compress(concatenatedBuffer)).length
const x = (await compress(buffers[0]!)).length
const y = (await compress(buffers[1]!)).length


const NCD = (xy - Math.min(x, y)) / Math.max(x, y);

console.log(`x: ${x}`);
console.log(`y: ${y}`);
console.log(`xy: ${xy}`);
console.log(`NCD: ${NCD}`)
