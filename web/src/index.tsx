import * as d3 from "d3";
import {
  Suspense,
  useDeferredValue,
  useMemo,
  useSyncExternalStore,
  type MouseEvent,
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

const width = window.innerWidth;
const height = window.innerHeight;

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// function SVG({ entriesStream }: { entriesStream: EntriesStream }) {
function SVG({ totalSize, entries }: { totalSize: number; entries: Entry[] }) {
  // const entries = useStream(entriesStream);

  console.log(entries);

  const tmapFunc = useMemo(
    () =>
      d3
        .pack<Entry>()
        // .tile(d3.treemapResquarify)
        .size([width, height])
        .padding(0),
    [width, height]
  );

  const nodes = useMemo(() => {
    const hierarchyRoot = d3
      .hierarchy<Entry>({
        file: ".",
        fileCompressionRatio: 1,
        fractionOfRepo: 1,
        _A_: 1,
        NCR_A: 1,
        A: totalSize,
        children: entries,
      } satisfies Entry)
      .sum((d) => d.A)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const tmap = tmapFunc(hierarchyRoot);

    return tmap.leaves();
  }, [entries.length]);

  const fontSize = 15;

  const gNodes = nodes.map((d) => {
    const width = d.r;
    const height = d.r;

    // const width = d.x1 - d.x0;
    // const height = d.y1 - d.y0;
    return (
      <g
        key={d.data.A}
        transform={`translate(${d.x - d.r / 2},${d.y - d.r / 2})`}
        style={{
          transition: "translate 0.5s, scale 0.5s",
          willChange: "translate scale",
        }}
        onClick={() => {
          console.log(d.data);
        }}
      >
        <rect
          width={width}
          height={height}
          r={width / 2}
          rx={width / 2}
          ry={width / 2}
          stroke={colorScale(d.data.NCR_A.toString())}
          fill={colorScale(d.data.NCR_A.toString())}
          style={{
            transition: "width 0.5s, height 0.5s",
            willChange: "width, height",
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
          {d.data.file}
        </text>
      </g>
    );
  });

  return (
    <svg height={height} width={width}>
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
    <SVG totalSize={result.AR} entries={result.NCR_As} />
  </Suspense>
);
