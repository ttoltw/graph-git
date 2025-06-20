/// <reference types="vite/client" />

declare const bridge: {
  git: {
    getLog: (folder: string) => Promise<GitRef[]>;
  };
  config: {
    get: () => Promise<Config>;
    set: (key:string, value:unknown) => Promise<void>;
  };
  getFolder: () => Promise<string | null>;
};
