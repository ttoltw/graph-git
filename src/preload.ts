// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

console.log('👋 This message is being logged by "preload.ts", included via Vite');

contextBridge.exposeInMainWorld('bridge', {
    git: {
        getLog: async (folder:string) => {
            return await ipcRenderer.invoke('git:log', folder);
        },
    },
    config: {
        get: async () => {
            return await ipcRenderer.invoke('config:get');
        },
        set: async (key:string,value: unknown) => {
            return await ipcRenderer.invoke('config:set', key, value);
        },
    },
    getFolder: async () => {
        return await ipcRenderer.invoke('open:folder');
    },
});
