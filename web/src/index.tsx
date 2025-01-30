import * as d3 from "d3";
import { useDeferredValue, useMemo, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import type { computeNCDForRepositoryFiles } from "../../compute.ts";

type Entry = Awaited<
  ReturnType<typeof computeNCDForRepositoryFiles>
>["NCD_As"][number] & {
  children: Entry[];
};

class EntriesStream {
  stream: ReadableStream<Uint8Array>;
  entries: Entry[] = [];
  subscribers = new Set<() => void>();

  constructor(stream: ReadableStream<Uint8Array>) {
    this.stream = stream;
    this.init();
  }

  subscribe(fn: () => void) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  getEntries() {
    return this.entries;
  }

  async init() {
    console.log("Init");
    // @ts-expect-error - TS doesn't know about for-await-of yet
    for await (const data of this.stream.pipeThrough(new TextDecoderStream())) {
      const newEntries: Entry[] = data
        .trim()
        .split("\n")
        .map((line: string) => {
          try {
            return JSON.parse(line) as Entry;
          } catch (error) {
            console.error("Error parsing line", error);
            console.log(line);
            return null;
          }
        });

      this.entries.push(...newEntries.filter(Boolean));
      this.subscribers.forEach((fn) => fn());
    }
  }
}

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight - 200;

type SVGEntry = {
  id: string;
  label: string;
  sizeValue: number;
  colorValue: number;
  children: SVGEntry[];
};

function SVG({
  rootId,
  sizeSum,
  colorSum,
  entries,
}: {
  rootId: string;
  sizeSum: number;
  colorSum: number;
  entries: SVGEntry[];
}) {
  const fontSize = 15;
  const basePadding = 10;
  const sizeMin = Math.min(...entries.map((x) => x.sizeValue));
  const sizeMax = Math.max(...entries.map((x) => x.sizeValue));
  const colorMin = Math.min(...entries.map((x) => x.colorValue));
  const colorMax = Math.max(...entries.map((x) => x.colorValue));

  console.log({ sizeMin, sizeMax, colorMin, colorMax });

  const colorScale = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([colorMin, colorMax]);

  // const entries = useStream(entriesStream);

  console.log(entries);

  const packingFunction = useMemo(
    () =>
      d3
        .treemap<SVGEntry>()
        .tile(d3.treemapResquarify)
        .paddingInner(basePadding)
        .paddingOuter(basePadding)
        .paddingTop(basePadding + fontSize)
        .size([windowWidth, windowHeight]),
    [windowWidth, windowHeight]
  );

  const nodes = useMemo(() => {
    const hierarchyRoot = d3
      .hierarchy<SVGEntry>({
        id: rootId,
        label: ".",
        sizeValue: 0,
        colorValue: 0,
        children: entries,
      } satisfies SVGEntry)
      .sum((d) => d.sizeValue)
      .sort((a, b) => (a.value ?? 0) - (b.value ?? 0));

    const tmap = packingFunction(hierarchyRoot);

    return tmap.descendants();
  }, [entries.length]);

  const gNodes = nodes.map((d) => {
    const width = d.x1 - d.x0;
    const height = d.y1 - d.y0;
    return (
      <g
        key={d.data.id}
        width={width}
        height={height}
        transform={`translate(${d.x0},${d.y0})`}
        onClick={(e) => {
          e.currentTarget.style.opacity = "0";
        }}
      >
        <rect
          className={d.data.children.length === 0 ? "leaf" : "branch"}
          width={width}
          height={height}
          {...(d.data.children.length === 0
            ? // Leaf node dynamic styles
              {
                fill: colorScale(d.data.colorValue),
                stroke: colorScale(d.data.colorValue),
              }
            : // Branch node dynamic styles
              {})}
          data-entry={JSON.stringify(d.data)}
        />
        {/* Text background square */}
        <rect
          x={0}
          y={0}
          width={width}
          height={fontSize * 1.5 * 3}
          fill="#ffffff55"
        />
        <text x={5} y={5 + 12} width={width} fontSize={`${fontSize}px`}>
          {d.data.label}
        </text>
        <text x={5} y={(5 + 12) * 2} width={width} fontSize={`${fontSize}px`}>
          size: {d.data.sizeValue.toFixed(4)}
        </text>
        <text x={5} y={(5 + 12) * 3} width={width} fontSize={`${fontSize}px`}>
          NCD: {d.data.colorValue.toFixed(4)}
        </text>
      </g>
    );
  });

  return (
    <svg
      width={windowWidth}
      height={windowHeight}
      viewBox={`0 0 ${windowWidth} ${windowHeight}`}
    >
      {gNodes}
    </svg>
  );
}

function useStream(entriesStream: EntriesStream) {
  const entries = useSyncExternalStore<Entry[]>(
    (fn) => entriesStream.subscribe(fn),
    () => entriesStream.getEntries()
  );
  return useDeferredValue(entries);
}

const response = await fetch("./data.json");
if (!response.body) {
  throw new Error(`No data: ${response.status}`);
}

const root = createRoot(document.getElementById("root")!);

// Stream is broken for now, due to compute() not being able to be streamed
// const entriesStream = new EntriesStream(response.body);
// root.render(
//   <Suspense fallback="Initializing...">
//     <SVG entriesStream={entriesStream} />
//   </Suspense>
// );

const result = (await response.json()) as Awaited<
  ReturnType<typeof computeNCDForRepositoryFiles>
>;

const sizeProperty: keyof (typeof result)["NCD_As"][number] = "A";
const colorProperty: keyof (typeof result)["NCD_As"][number] = "NCD_A";
const sizeSum = result.NCD_As.reduce((acc, x) => acc + x[sizeProperty], 0);
const colorSum = result.NCD_As.reduce((acc, x) => acc + x[colorProperty], 0);

root.render(
  <>
    <SVG
      rootId={result.targetDirectory}
      sizeSum={sizeSum}
      colorSum={colorSum}
      entries={result.NCD_As.map((x) => ({
        id: x.file,
        label: x.file.replace(result.targetDirectory, "."),
        sizeValue: x[sizeProperty],
        colorValue: x[colorProperty],
        children: [],
      }))}
    />
    <div className="legend">
      <span>Size: {sizeProperty}</span>
      <span>Color: {colorProperty}</span>
      <div
        style={{
          width: "256px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <span>Low NCD</span>
        <span>High NCD</span>
      </div>
      <div
        className="color"
        style={{
          width: "100%",
        }}
      ></div>
    </div>
    <div>
      <p>AR: {result.AR}</p>
      <p>|AR|: {result._AR_}</p>
      <p>Compression ratio for repository: {result._AR_ / result.AR}</p>
    </div>
  </>
);

// setTimeout(() => {
//   window.location.reload();
// }, 2000);
