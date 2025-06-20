import Dagre from "@dagrejs/dagre";
import React, { ReactNode } from "react";

type NodeProps = Dagre.Node<GitRef>;

const Node: React.FC<NodeProps> = ({
  refs,
  hash,
  width,
  height,
  x,
  y,
}) => {
  // Helper function to determine the CSS class based on ref name
  const getRefClass = (ref: string): string => {
    if (ref.startsWith("tag:")) return "git-ref-tag";
    if (ref.startsWith("HEAD ->")) return "git-ref-head";
    if (ref.startsWith("origin")) return "git-ref-remote";
    if (ref.includes("stash")) return "git-ref-stash";
    if (/^[0-9a-f]{7,40}$/.test(ref)) return "git-ref-commit";
    return "git-ref-branch";
  };
  if (!refs || refs.length === 0) refs = [hash.substring(0, 7)];
  return (
    <g transform={`translate(${x},${y})`}>
      {refs.map((ref, i) => {
        const refClass = getRefClass(ref);
        const rectY = -height / 2 + i * 20;
        return (
          <RoundedLabel
            key={ref}
            label={ref}
            x={-width / 2}
            y={rectY}
            className={`git-ref ${refClass}`}
            width={width}
            height={20}
            first={i === 0}
            last={i === refs.length - 1}
          />
        );
      })}
    </g>
  );
};

const RoundedLabel: React.FC<{
  label: string;
  x: number;
  y: number;
  className: string;
  width: number;
  height: number;
  first?: boolean;
  last?: boolean;
}> = ({ label, x, y, className, width, height, first, last }) => {
  const borderRadius = 5;
  let r: ReactNode = null;
  if (first === last) {
    r = (
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={first ? 5 : 0}
        ry={first ? 5 : 0}
      />
    );
  } else if (first) {
    r = (
      <path
        d={`
    M ${0},${0 + borderRadius}
    a ${borderRadius},${borderRadius} 0 0 1 ${borderRadius * 1},-${borderRadius}
    h ${width - borderRadius * 2}
    a ${borderRadius},${borderRadius} 0 0 1 ${borderRadius},${borderRadius}
    v ${height - borderRadius}
    h -${width}
    Z
      `}
      />
    );
  } else {
    // last
    r = (
      <path
        d={`
    M ${0},${0}
    h ${width}
    v ${height - borderRadius}
    a ${borderRadius},${borderRadius} 0 0 1 -${borderRadius},${borderRadius}
    h -${width - borderRadius * 2}
    a ${borderRadius},${borderRadius} 0 0 1 -${borderRadius},-${borderRadius}
    Z
      `}
      />
    );
  }

  return (
    <g transform={`translate(${x},${y})`} className={className}>
      {r}
      <text x={width / 2} y={"1em"} textAnchor="middle">
        {label}
      </text>
    </g>
  );
};

const Edge: React.FC<{ edge: Dagre.GraphEdge }> = ({ edge }) => {
  if (!edge) return null;
  const points = edge.points;
  return (
    <polyline
      points={points.map((p) => `${p.x},${p.y}`).join(" ")}
      style={{ fill: "none", stroke: "black" }}
      markerEnd="url(#arrowhead)"
    />
  );
};
const ArrowHead: React.FC = () => {
  return (
    <marker
      id="arrowhead"
      markerWidth="8"
      markerHeight="8"
      refX="6"
      refY="4"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path d="M 0 0 L 8 4 L 0 8 Z" fill="black" />
    </marker>
  );
};
export const Graph: React.FC<{ graph: Dagre.graphlib.Graph<GitRef> , scrollTo?: (x: number, y: number) => void }> = ({
  graph,
  scrollTo,
}) => {
  return (
    <svg width={graph.graph().width} height={graph.graph().height} onDoubleClick={(e) => {
      console.log("double click", e , scrollTo);
      e.preventDefault();
      e.stopPropagation();
      // scroll to the head node, make it the center of the screen
      const headNode = graph.nodes().find((node) => graph.node(node).refs?.some(ref => ref.startsWith("HEAD ->")));
      if (headNode) {
        const node = graph.node(headNode);
        const svg = e.currentTarget;
        const { x, y } = node;
  
        scrollTo && scrollTo(x , y);
      }
    }}>
      <defs>
        <ArrowHead />
      </defs>
      {graph.nodes().map((v) => (
        <Node key={v} {...graph.node(v)} />
      ))}
      {graph.edges().map((e) => (
        <Edge key={`${e.v}-${e.w}`} edge={graph.edge(e)} />
      ))}
    </svg>
  );
};
