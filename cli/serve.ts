#!/usr/bin/env node --experimental-strip-types

import { normalize, resolve } from "node:path";
import { computeNCDForRepositoryFiles } from "../compute.ts";
import express from "express";

const app = express();

app.use(express.static("web/public"));
app.use(express.static("build"));

const targetDirectory = process.argv[2] ?? ".";
const targetDirectoryNormalized = resolve(normalize(targetDirectory));

const includeGlobs = process.argv[3] ? [process.argv[3]] : undefined;
const excludeGlobs = process.argv[4] ? [process.argv[4]] : undefined;

const dataPromise = computeNCDForRepositoryFiles(targetDirectoryNormalized, {
  include: includeGlobs,
  exclude: excludeGlobs,
});

app.use(async (req, res, next) => {
  if (req.path === "/data.json") {
    res.json(await dataPromise);
  } else {
    next();
  }
});
const server = app.listen(3000);

console.log(`✅ Serving ${targetDirectoryNormalized} on http://localhost:3000`);
