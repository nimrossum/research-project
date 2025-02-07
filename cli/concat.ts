#!/usr/bin/env bun

// This file reads a list of files from the command line and concatenates them

import { readFileSync } from "fs";

const files = process.argv.slice(2).flatMap(f => f.split(" "))

const buffers = files.map(f => readFileSync(f))

const concatenatedBuffer = Buffer.concat(buffers)

console.log(concatenatedBuffer.toString("utf8"))

