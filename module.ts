import * as d3 from "d3";

const stream = (await fetch("./data.json")).body

if (!stream) {
  throw new Error("No data")
}
let i = 0

type Entry = {
  absolutePath: string;
  relativePath: string;
  size: number;
  children: Entry[];
};

const entries: Entry[] = []

const width = window.innerWidth;
const height = window.innerHeight;

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

const svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

for await (const data of stream.pipeThrough(new TextDecoderStream())) {
  i++
  const newEntries = data.trim().split("\n").map((line: string) => JSON.parse(line));
  console.log(newEntries.length)
  entries.push(...newEntries)
  d3.select("svg").selectAll("*").remove()

  const hierarchyRoot = d3.hierarchy({
    relativePath: ".",
    absolutePath: ".",
    size: 0,
    children: entries
  } satisfies Entry)
    .sum(d => d.size)
    .sort((a, b) => b.value - a.value);

  d3.treemap()
    .tile(d3.treemapSquarify)
    .size([width, height])
    .padding(0)
    (hierarchyRoot);

const nodes = svg.selectAll("g")
.data(hierarchyRoot.leaves())
.enter()
.append("g")
.attr("transform", d => `translate(${d.x0},${d.y0})`);

nodes.append("rect")
.attr("width", d => d.x1 - d.x0)
.attr("height", d => d.y1 - d.y0)
.attr("stroke", d => colorScale(d.data.size.toString()))
.attr("fill", d => colorScale(d.data.size.toString()));

nodes.append("text")
.attr("x", 5)
.attr("y", 20)
.text(d => d.data.relativePath)
.attr("fill", "white")
.attr("font-size", "12px")
.attr("font-family", "Arial");

}

