import * as d3 from "d3";
import {
  Suspense,
  useDeferredValue,
  useMemo,
  useSyncExternalStore,
} from "react";
import { createRoot } from "react-dom/client";
import type { computeNCRForRepositoryFiles } from "../../compute.ts";

type Entry = Awaited<
  ReturnType<typeof computeNCRForRepositoryFiles>
>["NCR_As"][number] & {
  children?: Entry[];
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
const windowHeight = window.innerHeight;

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

type SVGEntry = {
  id: string;
  label: string;
  value: number;
  children?: SVGEntry[];
};
// function SVG({ entriesStream }: { entriesStream: EntriesStream }) {
function SVG({
  rootId,
  totalSize,
  entries,
}: {
  rootId: string;
  totalSize: number;
  entries: SVGEntry[];
}) {
  // const entries = useStream(entriesStream);

  console.log(entries);

  const tmapFunc = useMemo(
    () =>
      d3
        .treemap<SVGEntry>()
        .tile(d3.treemapResquarify)
        .size([windowWidth, windowHeight])
        .padding(0),
    [windowWidth, windowHeight]
  );

  const nodes = useMemo(() => {
    const hierarchyRoot = d3
      .hierarchy<SVGEntry>({
        id: rootId,
        label: ".",
        value: totalSize,
        children: entries,
      } satisfies SVGEntry)
      .sum((d) => d.value)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const tmap = tmapFunc(hierarchyRoot);

    return tmap.leaves();
  }, [entries.length]);

  const fontSize = 15;

  const gNodes = nodes.map((d) => {
    const width = d.x1 - d.x0;
    const height = d.y1 - d.y0;
    return (
      <g
        key={d.data.id}
        width={width}
        height={height}
        // x={d.x0}
        // y={d.y0}
        transform={`translate(${d.x0},${d.y0})`}
      >
        <rect
          style={{
            transition: "all 300ms",
            willChange: "translate scale width",
          }}
          stroke={colorScale(d.data.value.toString())}
          fill={colorScale(d.data.value.toString())}
          width={width}
          height={height}
          onClick={() => {
            console.log(d.data);
          }}
          data-entry={JSON.stringify(d.data)}
        />
        <text
          x={5}
          y={5 + 12}
          width={width}
          fill="white"
          fontSize={`${fontSize}px`}
          fontFamily="Arial"
        >
          {d.data.label}
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
  ReturnType<typeof computeNCRForRepositoryFiles>
>;

root.render(
  <Suspense fallback="Initializing...">
    <SVG
      rootId={result.targetDirectory}
      totalSize={result.AR}
      entries={result.NCR_As.map((x) => ({
        id: x.file,
        label: x.file.replace(result.targetDirectory, ""),
        value: x.A,
      }))}
    />
  </Suspense>
);

setTimeout(() => {
  window.location.reload();
}, 2000);
