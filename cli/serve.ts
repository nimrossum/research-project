import { computeNCRForRepositoryFiles, computeStream } from "../compute.ts";
import express from "express";

const app = express();

app.use(express.static("web/public"));
app.use(express.static("build"));

app.use(async (req, res, next) => {
  if (req.path === "/data.json") {
    res.json(await computeNCRForRepositoryFiles("C:/Users/jonas/p/git-truck"));
  } else {
    next();
  }
});
const server = app.listen(3000);
