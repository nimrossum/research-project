import { useDeferredValue, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { Treemap } from "@/lib/Treemap.tsx";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "web/lib/ui/table.tsx";
import { computeNCDForRepositoryFiles } from "compute.ts";

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
    <Treemap
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
    <div className="grid">
      <p>AR: {result.AR}</p>
      <p>|AR|: {result._AR_}</p>
      <p>Compression ratio for repository: {result._AR_ / result.AR}</p>
    </div>
  </>
);

// setTimeout(() => {
//   window.location.reload();
// }, 2000);
