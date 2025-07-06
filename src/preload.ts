// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
let streamid = 0;

console.log('👋 This message is being logged by "preload.ts", included via Vite');

contextBridge.exposeInMainWorld("bridge", {
  git: {
    async exec(args: string[] = []) {
      streamid++;

      const port = invokeStreamChannel<string>("git:command", args);
      // send messagePort to renderer
      window.postMessage({ type: "git:stream", streamid }, "*", [port]);
      // return streamid to renderer, renderer will use this streamid to get the messagePort
      return streamid;
    },
  },
  config: {
    get: async () => {
      return await ipcRenderer.invoke("config:get");
    },
    set: async (key: string, value: unknown) => {
      await ipcRenderer.invoke("config:set", key, value);
    },
  },
  getFolder: async () => {
    return await ipcRenderer.invoke("open:folder");
  },
});

function invokeStreamChannel<T>(channelName: string, args: unknown[]): MessagePort {
  const { port1, port2 } = new MessageChannel();
  ipcRenderer.postMessage(channelName, args, [port1]);
  return port2;
}
