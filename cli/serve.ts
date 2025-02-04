#!/usr/bin/env node --experimental-strip-types

import app from "@/web/index.html";
import ncd from "@/web/ncd/index.html";
import { join, normalize, resolve } from "node:path";
import { computeNCDForRepositoryFiles } from "../compute.ts";
import { serve } from "bun";

if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.log(`Usage: serve.ts [directory] [exclude] [include]`);
  process.exit(0);
}

const server = serve({
  static: {
    "/": app,
    "/ncd": ncd,
  },
  async fetch(req: Request) {
    const url = new URL(req.url);
    switch (url.pathname) {
      case "/data.json": {
        const data = await getData();
        return Response.json(data);
      }
      default: {
        if (url.pathname.startsWith("/static")) {
          const path = join("./web", url.pathname);
          return new Response(await Bun.file(path).bytes());
        }
        return new Response("Not found: " + req.url, {
          status: 404,
          statusText: "Not Found",
        });
      }
    }

  },
});

console.log(`✅ Serving on ${server.url}`);

async function getData() {
  const targetDirectory = process.argv[2] ?? ".";
  const targetDirectoryNormalized = resolve(normalize(targetDirectory));

  const excludeGlobs = process.argv[3] ? [process.argv[3]] : undefined;
  const includeGlobs = process.argv[4] ? [process.argv[4]] : undefined;

  const dataPromise = computeNCDForRepositoryFiles(
    targetDirectoryNormalized,
    {
      exclude: excludeGlobs,
      include: includeGlobs,
    }
  );
  const data = { targetDirectory, ...(await dataPromise) };
  return data;
}

export type Data = Awaited<ReturnType<typeof getData>>;

// const app = express();

// app.use(express.static("web/public"));
// app.use(express.static("build"));

// app.use(async (req, res, next) => {
//   const targetDirectory = process.argv[2] ?? ".";
//   const targetDirectoryNormalized = resolve(normalize(targetDirectory));

//   const includeGlobs = process.argv[3] ? [process.argv[3]] : undefined;
//   const excludeGlobs = process.argv[4] ? [process.argv[4]] : undefined;

//   const dataPromise = computeNCDForRepositoryFiles(targetDirectoryNormalized, {
//     include: includeGlobs,
//     exclude: excludeGlobs,
//   });
//   if (req.path === "/data.json") {
//     res.json(await dataPromise);
//   } else {
//     next();
//   }
// });
// const server = app.listen(3000);

// console.log(`✅ Serving ${targetDirectoryNormalized} on http://localhost:3000`);
