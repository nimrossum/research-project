import { createRoot } from "react-dom/client";
import { Treemap } from "@/web/lib/Treemap.tsx";
import { createForceGraph } from "../lib/ForceGraph";
import type { NCDJSONResult } from "@/cli/ncd-pair-repo";

type Key = `${string}|${string}`;
type SimDist = number;

const urlSearchParams = new URLSearchParams(window.location.search);
const project =
  urlSearchParams.get("project") ?? "git-truck";
const response = await fetch(`./static/data/${project}.json`);
if (!response.body) {
  throw new Error(`No data: ${response.status}`);
}

document.title = `${project} - NCD Graph`;

const rootEl = document.getElementById("root")!;
const root = createRoot(rootEl);

const jsonDataResponse = (await response.json()) as NCDJSONResult;
console.log(jsonDataResponse);
const {
  paths,
  pairMap,
  pairMapNormalized,
  accumulatedDistanceMap,
  parentDirectoryMap,
  totalAccumulatedDistance: summedDistance,
} = jsonDataResponse;

const getGroup = (d: { id: string; group: string }): string => d.group;
const getRadius = (d: { id: string; group: string }): number =>
  5 + (accumulatedDistanceMap[d.id]!) * 10;
const calculateLinkStrokeWidth = (l: {
  source: string;
  target: string;
  weight: number;
}): number => 3 + l.weight ** 1_000;
// Normalize the link weights from 0.99 to 1.XX to 0 - 1

// const isFileExtension = true;
const isFileExtension = urlSearchParams.get("group") === "file";

const graph = createForceGraph(
  {
    nodes: paths.map((x) => ({
      id: x!,
      group: isFileExtension ? x.split(".").pop()! : parentDirectoryMap[x!]!,
    })),
    links: Object.entries(pairMap)
      .map(([key, value]) => {
        const [source, target] = key.split("|") as [string, string];
        return { source, target, weight: value };
      })
      .filter((l) => l.weight < 0.8 && l.source !== l.target && Math.random() > 0.3)
      .map((l) => ({
        ...l,
        weight: l.weight ** -4,
      })),
  },
  {
    nodeGroup: getGroup,
    nodeRadius: getRadius,
    nodeGroups: isFileExtension
      ? new Set(paths.map((x) => x.split(".").pop()!)).values().toArray()
      : new Set(Object.values(parentDirectoryMap)).values().toArray(),
    nodeTitle: (d) =>
      `${d.id.split("\\").pop()} g:${d.group} r:${getRadius(d)} ad:${
        accumulatedDistanceMap[d.id]
      }`,
    linkStrokeWidth: calculateLinkStrokeWidth,
    width: 2560,
    height: 1440,
  }
);

rootEl.appendChild(graph);
// rootEl.appendChild(legend);

// root.render(

// );

// setTimeout(() => {
//   window.location.reload();
// }, 2000);
