import './assets/index.css';
import React, { useState } from 'react';
import Dagre from '@dagrejs/dagre';
import { Graph } from './components/Graph';
import { useConfig } from './hooks';
import type { GitLog } from '@g/git-wrap';

const App: React.FC = () => {
    const [cwd, setCwd] = useConfig<string | null>("cwd", null);
    const [recent, setRecent] = useConfig<string[]>("recent", []);
    const [graph, setGraph] = useState<Dagre.graphlib.Graph<GitLog> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const refContainer = React.useRef<HTMLDivElement>(null);
    const onOpenBtn = async () => {
        try {
            const folder = await bridge.getFolder();
            if (!folder) {
                throw new Error('No folder selected');
            }
            console.log(`Selected folder: ${folder}`);
            await onReloadBtn(folder);
        } catch (e) {
            console.error('Error:', e);
            setError(e.message);
            setGraph(null);
        }
    };
    const onReloadBtn = async (folder?: string) => {
        try {
            folder = folder || cwd;
            if (!folder) {
                throw new Error('No folder selected');
            }
            console.log(`Selected folder: ${folder}`);
            const log = await bridge.git.getLog(folder);

            const graph = new Dagre.graphlib.Graph<GitLog>();
            graph.setGraph({ rankdir: 'TD' });
            graph.setDefaultEdgeLabel(() => ({}));
            log.forEach((log) => {
                const labels = log.refs || [log.hash.substring(0, 7)];
                const refs = labels.map((ref: string) => ref.trim()).filter((ref: string) => ref);
                graph.setNode(log.hash, { refs, width: Math.max(100, ...refs.map(ref => ref.length * 10)), height: 20 * refs.length });
                if (log.parents) {
                    log.parents.forEach((parent: string) => {
                        graph.setEdge(log.hash, parent);
                    });
                }
            });
            Dagre.layout(graph);
            setGraph(graph);
            setCwd(folder);
            setRecent((prev) => {
                const newRecent = [...new Set([folder, ...prev])];
                return newRecent.slice(0, 10);
            });
            setError(null);
            console.log('Graph:', graph);
        } catch (e) {
            console.error('Error:', e);
            setError(e.message);
            setGraph(null);
        }
    }
    return (
        <div className="app-container">
            <div className="toolbar">
                <button title='open git folder' onClick={onOpenBtn}>open</button>
                <button title='reload' disabled={!cwd} onClick={() => onReloadBtn()}>reload</button>
                <select title='recent folders' 
                    value={cwd || ''}
                    onChange={(e) => {
                        onReloadBtn(e.target.value);
                    }}
                    >
                    {recent.map((folder, index) => (
                        <option key={index} value={folder} onClick={() => onReloadBtn(folder)}>{folder}</option>
                    ))}
                </select>
            </div>
            <div ref={refContainer} className="content">
                {error && <div className="error">{error}</div>}
                {graph && (
                    <div className="svg-container">
                        <Graph graph={graph} scrollTo={(x, y) => {
                            const cnt = refContainer.current;
                                console.log('scrollTo', x, y, cnt);
                            
                            if (cnt) {
                                cnt.scrollTo({
                                    top: y - cnt.clientHeight / 2,
                                    left: x - cnt.clientWidth / 2,
                                    behavior: 'smooth'
                                });
                            }
                        }} />
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
