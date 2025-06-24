import Dagre from "@dagrejs/dagre";
import React, { ReactNode } from "react";
import type { GitLog, GitRef } from '@g/git-wrap';

type NodeData = {
  log: GitLog;
}

type NodeProps = Dagre.Node<NodeData>;

const Node: React.FC<NodeProps> = ({
  log,
  width,
  height,
  x,
  y,
}) => {
  // Helper function to determine the CSS class based on ref name
  const getRefClass = (ref: GitRef) => {
    let className = "git-ref-other";
    if (ref.current) {
      className = "git-ref-head";
    } else if (ref.type === "commit") {
      className = "git-ref-commit";
    } else if (ref.type === "tag") {
      className = "git-ref-tag";
    } else if (ref.type === "branch") {
      className = "git-ref-branch";
    } else if (ref.type === "remote") {
      className = "git-ref-remote";
    } else if (ref.type === "stash") {
      className = "git-ref-stash";
    }
    return className;
  };

  const refs = log?.refs || [{
    hash: log.hash,
    name: log.hash.substring(0, 7),
    type: "commit",
    remote: false,
    fullname: log.hash,
  }];
  return (
    <g transform={`translate(${x},${y})`}>
      {refs.map((ref, i) => {
        const refClass = getRefClass(ref);
        const rectY = -height / 2 + i * 20;
        return (
          <RoundedLabel
            key={ref.fullname}
            label={ref.name}
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
export const Graph: React.FC<{ graph: Dagre.graphlib.Graph<NodeData>, scrollTo?: (x: number, y: number) => void }> = ({
  graph,
  scrollTo,
}) => {
  return (
    <svg width={graph.graph().width} height={graph.graph().height} onDoubleClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      // scroll to the head node, make it the center of the screen
      const headNode = graph.nodes().find((node) => graph.node(node).log.refs?.some(ref => ref.current));
      if (headNode) {
        const node = graph.node(headNode);
        const svg = e.currentTarget;
        const { x, y } = node;

        scrollTo && scrollTo(x, y);
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
