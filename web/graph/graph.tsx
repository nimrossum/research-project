import { createRoot } from "react-dom/client";
import { Treemap } from "@/web/lib/Treemap.tsx";
import { createForceGraph } from "../lib/ForceGraph";

type Key = `${string}|${string}`;
type SimDist = number;
type Data = Record<Key, SimDist>;

const project =
  new URLSearchParams(window.location.search).get("project") ?? "git-truck";
const response = await fetch(`./static/data/${project}.json`);
if (!response.body) {
  throw new Error(`No data: ${response.status}`);
}

const rootEl = document.getElementById("root")!;
const root = createRoot(rootEl);

const result = (await response.json()) as Data;

const graph = createForceGraph(
  {
    nodes: new Set(Object.keys(result).map((x) => x.split("|")[0]))
      .values()
      .toArray()
      .map((x) => ({
        id: x!,
        group: x.split("\\")[6]!,
      })),
    links: Object.entries(result)
      .map(([key, value]) => {
        const [source, target] = key.split("|") as [string, string];
        return { source, target, weight: Math.sqrt(value) };
      })
      .filter((l) => l.weight < 0.90)
      ,
  },
  {
    nodeGroup: (d) => d.group,
    // nodeRadius: d => d.
    nodeGroups: Array.from(new Set(Object.keys(result).map((x) => x.split("|")[0].split("\\")[6]!))),
    nodeTitle: (d) => `${d.group} - ${d.id}`,
    linkStrokeWidth: (l) => l.weight ** 3,
    width: 1920,
    height: 1080,
  }
);

rootEl.appendChild(graph);
// rootEl.appendChild(legend);

// root.render(

// );

// setTimeout(() => {
//   window.location.reload();
// }, 2000);
