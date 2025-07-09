import "./assets/index.css";
import React, { useState, useRef } from "react";
import Dagre from "@dagrejs/dagre";
import { Graph, GraphRef, ZoomRatio } from "./components/Graph";
import { Sidebar } from "./components/Sidebar";
import { useConfig } from "./hooks";
import { GitWrap, GitLog, GitRef } from "@g/git-wrap";

import { portToAsyncGenerator } from "../shared/portToAsyncGenerator";
import { getGitStream } from "./bridgeChannel";

const git = new GitWrap(async function* (...args): AsyncGenerator<string> {
  const streamid = await bridge.git.exec(args);
  const port: MessagePort = await getGitStream(streamid);
  for await (const data of portToAsyncGenerator<string>(port)) {
    yield data;
  }
});

const App: React.FC = () => {
  const [cwd, setCwd] = useConfig<string | null>("cwd", null);
  const [recent, setRecent] = useConfig<string[]>("recent", []);
  const [graph, setGraph] = useState<Dagre.graphlib.Graph<{ log: GitLog }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const graphRef = useRef<GraphRef>(null);
  const onOpenBtn = async () => {
    try {
      const folder = await bridge.getFolder();
      if (!folder) {
        throw new Error("No folder selected");
      }
      console.log(`Selected folder: ${folder}`);
      await onReloadBtn(folder);
    } catch (e) {
      console.error("Error:", e);
      setError(e.message);
      setGraph(null);
    }
  };
  const onReloadBtn = async (folder?: string) => {
    try {
      folder = folder || cwd;
      if (!folder) {
        throw new Error("No folder selected");
      }

      await setCwd(folder);
      console.log(`Selected folder: ${folder}`);
      const log = await git.log();

      const graph = new Dagre.graphlib.Graph<{ log: GitLog }>();
      graph.setGraph({ rankdir: "TD" }); // top to bottom
      graph.setDefaultEdgeLabel(() => ({}));
      log.forEach((log) => {
        const refs = log.refs?.length
          ? log.refs.map((ref) => ref.name)
          : [log.hash.substring(0, 7)];

        graph.setNode(log.hash, {
          log,
          width: Math.max(100, ...refs.map((ref) => ref.length * 10)),
          height: 20 * refs.length,
        });
        if (log.parents) {
          log.parents.forEach((parent: string) => {
            graph.setEdge(log.hash, parent);
          });
        }
      });
      Dagre.layout(graph);
      setGraph(graph);
      setRecent((prev) => {
        const newRecent = [...new Set([folder, ...prev])];
        return newRecent.slice(0, 10);
      });
      setError(null);
      console.log("Graph:", graph);
    } catch (e) {
      console.error("Error:", e);
      setError(e.message);
      setGraph(null);
    }
  };
  const onFetchBtn = async () => {
    try {
      if (!cwd) {
        throw new Error("No folder selected");
      }
      await git.fetch();
      // Optionally reload the graph after fetch
      await onReloadBtn();
    } catch (e) {
      console.error("Fetch error:", e);
      setError(e.message);
    }
  };

  const handleRefClick = (gitRef: GitRef) => {
    console.log("handleRefClick", gitRef);
    graphRef.current?.scrollTo(gitRef.hash);
  };

  const handleGraphZoom = (ratio: ZoomRatio) => {
    graphRef.current?.zoom(ratio);
  };

  return (
    <div className="app-container">
      <div className="toolbar">
        <button title="open git folder" onClick={onOpenBtn}>
          open
        </button>
        <button title="reload" disabled={!cwd} onClick={() => onReloadBtn()}>
          reload
        </button>
        <button title="fetch" disabled={!cwd} onClick={onFetchBtn}>
          fetch
        </button>
        <select
          title="recent folders"
          value={cwd || ""}
          onChange={(e) => {
            onReloadBtn(e.target.value);
          }}
        >
          {recent.map((folder, index) => (
            <option key={index} value={folder} onClick={() => onReloadBtn(folder)}>
              {folder}
            </option>
          ))}
        </select>
        <div className="zoom-controls">
          <button title="zoom in" disabled={!graph} onClick={() => handleGraphZoom("zoomIn")}>
            +
          </button>
          <button title="zoom out" disabled={!graph} onClick={() => handleGraphZoom("zoomOut")}>
            -
          </button>
          <button title="reset zoom" disabled={!graph} onClick={() => handleGraphZoom("reset")}>
            100%
          </button>
          <button title="fit to view" disabled={!graph} onClick={() => handleGraphZoom("fit")}>
            fit
          </button>
        </div>
      </div>
      <div className="content">
        <Sidebar graph={graph} onRefClick={handleRefClick} />
        <Graph ref={graphRef} error={error} graph={graph} />
      </div>
      <div className="bottom-container">
        <div className="status-bar">
          <span>Status: {error ? "Error" : "Ready"}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
