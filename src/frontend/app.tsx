import "./assets/index.css";
import React, { useState } from "react";
import Dagre from "@dagrejs/dagre";
import { Graph } from "./components/Graph";
import { useConfig } from "./hooks";
import { GitWrap, GitLog } from "@g/git-wrap";

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
  const refContainer = React.useRef<HTMLDivElement>(null);
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
      </div>
      <div ref={refContainer} className="content">
        {error && <div className="error">{error}</div>}
        {graph && (
          <div className="svg-container">
            <Graph
              graph={graph}
              scrollTo={(x, y) => {
                const cnt = refContainer.current;
                console.log("scrollTo", x, y, cnt);

                if (cnt) {
                  cnt.scrollTo({
                    top: y - cnt.clientHeight / 2,
                    left: x - cnt.clientWidth / 2,
                    behavior: "smooth",
                  });
                }
              }}
            />
          </div>
        )}
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
