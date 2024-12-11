import { normalize } from "node:path";
import { computeNCRForRepositoryFiles, computeStream } from "../compute.ts";
import express from "express";

const app = express();

app.use(express.static("web/public"));
app.use(express.static("build"));

const targetDirectory = process.argv[2] ?? ".";
const targetDirectoryNormalized = normalize(targetDirectory);

app.use(async (req, res, next) => {
  if (req.path === "/data.json") {
    res.json(await computeNCRForRepositoryFiles(targetDirectoryNormalized));
  } else {
    next();
  }
});
const server = app.listen(3000);
