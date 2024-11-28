import { file, serve, type Serve } from "bun";
import { compute, computeStream } from "./compute";

const createServerConfiguration: () => Promise<Serve<unknown>> =
  async () => ({
    port: 3000,
    development: true,
    static: {
      "/": new Response(await file("public/index.html").bytes()),
      "/module.js": new Response(await file("build/module.js").bytes(), {
        headers: {
          "Content-Type": "text/javascript",
        },
      }),
      // "/data.json": new Response(
      //   // await file("data.json").bytes(),
      //   await compute("C:/Users/jonas/p/git-truck"),
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //   }
      // ),
    },
    fetch(request, server) {
      const url = new URL(request.url)
      if (url.pathname === "/data.json") {
        return new Response(
          computeStream("C:/Users/jonas/p/git-truck"), {
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
      }
      return new Response("Not found", { status: 404 });
    },
  });

const server = serve(await createServerConfiguration());

setInterval(async () => {
  console.log("Reloading server");
  server.reload(await createServerConfiguration());
}, 10_000);

console.log("Server running on http://localhost:3000");
