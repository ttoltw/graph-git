import React from "react";
import type { GitLog, GitRef } from "@g/git-wrap";
import Dagre from "@dagrejs/dagre";
import "../assets/sidebar.css";

interface SidebarProps {
  graph: Dagre.graphlib.Graph<{ log: GitLog }> | null;
  onRefClick: (gitRef: GitRef) => void;
}

// Helper function to determine the CSS class based on ref name
const getRefClass = (ref: GitRef) => {
  if (ref.current) {
    return "sidebar-ref-head";
  } else if (ref.type === "commit") {
    return "sidebar-ref-commit";
  } else if (ref.type === "tag") {
    return "sidebar-ref-tag";
  } else if (ref.type === "branch") {
    return "sidebar-ref-branch";
  } else if (ref.type === "remote") {
    return "sidebar-ref-remote";
  } else if (ref.type === "stash") {
    return "sidebar-ref-stash";
  }
  return "sidebar-ref-other";
};

// Group refs by type for better organization
const groupRefsByType = (graph: Dagre.graphlib.Graph<{ log: GitLog }>) => {
  const refGroups: {
    [key: string]: Array<{ ref: GitRef; hash: string; log: GitLog }>;
  } = {
    branch: [],
    tag: [],
    remote: [],
    stash: [],
    commit: [],
  };

  graph.nodes().forEach((node) => {
    const nodeData = graph.node(node);
    const refs = nodeData.log.refs;
    if (!refs) {
      return;
    }

    refs.forEach((ref) => {
      const groupKey = ref.type;
      if (!refGroups[groupKey]) {
        refGroups[groupKey] = [];
      }
      refGroups[groupKey].push({ ref, hash: nodeData.log.hash, log: nodeData.log });
    });
  });

  return refGroups;
};

export const Sidebar: React.FC<SidebarProps> = ({ graph, onRefClick }) => {
  if (!graph) {
    return (
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Refs</h3>
        </div>
        <div className="sidebar-content">
          <p className="sidebar-empty">No repository loaded</p>
        </div>
      </div>
    );
  }

  const refGroups = groupRefsByType(graph);

  const handleRefClick = (gitRef: GitRef) => {
    onRefClick(gitRef);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Refs</h3>
      </div>
      <div className="sidebar-content">
        {Object.entries(refGroups).map(([groupKey, refs]) => {
          if (refs.length === 0) return null;

          const groupLabels = {
            head: "HEAD",
            branch: "Branches",
            tag: "Tags",
            remote: "Remote",
            stash: "Stash",
            commit: "Commits",
          };

          return (
            <div key={groupKey} className="sidebar-group">
              <h4 className="sidebar-group-title">
                {groupLabels[groupKey as keyof typeof groupLabels]}
              </h4>
              <div className="sidebar-ref-list">
                {refs.map(({ ref, hash, log }) => (
                  <div
                    key={`${ref.fullname}-${hash}`}
                    className={`sidebar-ref-item ${getRefClass(ref)}`}
                    onClick={() => handleRefClick(ref)}
                    title={`${ref.name} (${log.hash.substring(0, 7)})`}
                  >
                    <span className="sidebar-ref-name">{ref.name}</span>
                    <span className="sidebar-ref-hash">{log.hash.substring(0, 7)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
