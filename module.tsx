import * as d3 from "d3";
import {
  Suspense,
  use,
  useDeferredValue,
  useMemo,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from "react";
import { createRoot } from "react-dom/client";

type Entry = {
  absolutePath: string;
  relativePath: string;
  size: number;
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

// const entries: Entry[] = [];
// const subscribers = new Set<() => void>();

// const subscribe = (fn: () => void) => {
//   subscribers.add(fn);
//   return () => subscribers.delete(fn);
// };

// const getEntries = () => entries;

// const stream = (await fetch("./data.json")).body;

// for await (const data of stream.pipeThrough(new TextDecoderStream())) {
//   const newEntries = data
//     .trim()
//     .split("\n")
//     .map((line: string) => {
//       try {
//         return JSON.parse(line);
//       } catch (error) {
//         console.error("Error parsing line", error);
//         return null;
//       }
//     });

//   entries.push(...newEntries);
//   subscribers.forEach((fn) => fn());
// }
// if (!stream) {
//   throw new Error("No data");
// }
// let i = 0;

const width = window.innerWidth;
const height = window.innerHeight;

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

function SVG() {
  const entries = useStream();

  const tmapFunc = useMemo(
    () =>
      d3
        .treemap<Entry>()
        .tile(d3.treemapSquarify)
        .size([width, height])
        .padding(0),
    [width, height]
  );

  const nodes = useMemo(() => {
    const hierarchyRoot = d3
      .hierarchy<Entry>({
        relativePath: ".",
        absolutePath: ".",
        size: 0,
        children: entries,
      } satisfies Entry)
      .sum((d) => d.size)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const tmap = tmapFunc(hierarchyRoot);

    return tmap.descendants();
  }, [entries.length]);

  const gNodes = nodes.map((d) => (
    <g
      key={d.data.absolutePath}
      transform={`translate(${d.x0},${d.y0})`}
      style={{ transition: "transform 0.5s", willChange: "transform" }}
    >
      <rect
        width={d.x1 - d.x0}
        height={d.y1 - d.y0}
        stroke={colorScale(d.data.size.toString())}
        fill={colorScale(d.data.size.toString())}
        style={{
          transition: "width 0.5s, height 0.5s",
          willChange: "width, height",
        }}
        data-entry={JSON.stringify(d.data)}
      />
      <text x={5} y={20} fill="white" font-size="12px" font-family="Arial">
        {d.data.relativePath}
      </text>
    </g>
  ));

  return (
    <svg
      height={height}
      width={width}
      onClick={(e: MouseEvent<SVGSVGElement>) => {
        const target = e.target as SVGElement;
        console.log(target.tagName);
        if (target.tagName === "rect") {
          target.style.stroke = "black";
        }
      }}
    >
      {gNodes}
    </svg>
  );
}

function Test() {
  const data = use(new Promise(resolve=> {
    console.log("Fetching data");
    resolve({ hello: "world" });
  }));



  return data.hello;
}

function useStream() {
  const stream = useState(() => (fetch("./data.json"))).body;
  if (!stream) {
    throw new Error("No data");
  }
  const entriesStream = new EntriesStream(stream);
  const entries = useSyncExternalStore<Entry[]>(
    entriesStream.subscribe,
    entriesStream.getEntries
  );
  return useDeferredValue(entries);
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <Suspense fallback="Initializing...">
    {/* <SVG /> */}
    <Test />
  </Suspense>
);