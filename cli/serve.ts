#!/usr/bin/env node --experimental-strip-types

import app from "../web/public/index.html";
import { normalize, resolve } from "node:path";
import { computeNCDForRepositoryFiles } from "../compute.ts";
import { serve } from "bun";

serve({
  static: {
    "/": app,
    
  },
  async fetch(req: Request) {
    const targetDirectory = process.argv[2] ?? ".";
    const targetDirectoryNormalized = resolve(normalize(targetDirectory));

    const includeGlobs = process.argv[3] ? [process.argv[3]] : undefined;
    const excludeGlobs = process.argv[4] ? [process.argv[4]] : undefined;

    const dataPromise = computeNCDForRepositoryFiles(
      targetDirectoryNormalized,
      {
        include: includeGlobs,
        exclude: excludeGlobs,
      }
    );
    const url = new URL(req.url);
    switch (url.pathname) {
      case "/data.json": {
        return Response.json(await dataPromise);
      }
      default: {
        return new Response("Not found: " + req.url, {
          status: 404,
          statusText: "Not Found",
        });
      }
    }
  },
});

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
