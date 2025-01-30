import { Glob } from "bun";
import { stat } from "node:fs/promises";

const glob = new Glob("**/*.*");

for await (const entry of glob.scan({
  cwd: ".",
  absolute: true,
  onlyFiles: false,
})) {
  const stats = await stat(entry);
  console.log(entry + (stats.isDirectory() ? "📁" : ""));
}

console.log("done");
