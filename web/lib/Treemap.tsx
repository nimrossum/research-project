import * as d3 from "d3";
import { useMemo } from "react";

type SVGEntry = {
  id: string;
  label: string;
  sizeValue: number;
  colorValue: number;
  children: SVGEntry[];
};

export function Treemap({
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
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight - 200;
  const fontSize = 15;
  const basePadding = 10;

  const sizeValues = entries.map((x) => x.sizeValue);
  const colorValues = entries.map((x) => x.colorValue);
  const sizeMin = Math.min(...sizeValues);
  const sizeMax = Math.max(...sizeValues);
  const colorMin = Math.min(...colorValues);
  const colorMax = Math.max(...colorValues);

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
