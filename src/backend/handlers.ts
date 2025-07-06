/// <reference types="@types/node" />

import { BrowserWindow, dialog, ipcMain, app } from "electron";
import { Store } from "./store";
import fs from "node:fs";
import { registerStreamChannel } from "./stream-channel";
import { gitExecutor, setCwd } from "./gitExecutor";

const store = new Store();
let initialized = false;
const userDataPath = app.getPath("userData");
const configPath = `${userDataPath}/config.json`;

export function init(window: BrowserWindow) {
  console.log("init handlers");
  window.webContents.ipc.handle("open:folder", async (event, ...args) => {
    const folder = await getFolder(window);
    setCwd(folder);
    return folder;
  });

  if (initialized) return;

  ipcMain.handle("cwd:set", async (event, folder: string) => {
    setCwd(folder);
  });

  ipcMain.handle("config:get", async (event, ...args) => {
    return configGet();
  });

  ipcMain.handle("config:set", async (event, ...args) => {
    const key = args[0];
    const value = args[1];
    console.log("Config set:", key, value);
    configSet(key, value);
  });

  if (!fs.existsSync(userDataPath)) {
    console.log("Creating user data folder");
    fs.mkdirSync(userDataPath, { recursive: true });
  } else if (fs.existsSync(configPath)) {
    console.log("Loading config file");
    const data = fs.readFileSync(configPath, "utf-8");
    store.set(JSON.parse(data));
    setCwd(store.get("cwd") as string);
  }
  initialized = true;
}

async function getFolder(window: BrowserWindow): Promise<string | null> {
  const result = await dialog.showOpenDialog(window, {
    properties: ["openDirectory"],
    defaultPath: store.get("cwd") as string,
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const selectedFolder = result.filePaths[0];
    console.log(`Selected folder: ${selectedFolder}`);
    return selectedFolder;
  }
  console.log("User canceled the dialog or no folder selected");
  return null;
}

registerStreamChannel("git:command", ([command, ...args]: [string, string, ...string[]]) => {
  console.log(`[git:command] Running command: ${command}, args: ${JSON.stringify(args)}`);
  return gitExecutor(command, ...args);
});

export function configGet() {
  const config = store.get();
  console.log("configGet:", config);
  return config;
}

export function configSet(key: string, value: unknown) {
  store.set(key, value);
  if (key === "cwd") {
    setCwd(value as string);
  }
  if (!fs.existsSync(configPath)) {
    console.log("Creating config file");
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(store.data, null, 2));
  console.log(`Config saved to ${configPath}, key: ${key}, value: ${value}`);
}
