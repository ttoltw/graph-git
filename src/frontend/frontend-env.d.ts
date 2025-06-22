/// <reference types="vite/client" />
import type { GitLog } from '@g/git-wrap';
declare global {
  declare const bridge: {
    git: {
      getLog: (folder: string) => Promise<GitLog[]>;
    };
    config: {
      get: () => Promise<Config>;
      set: (key: string, value: unknown) => Promise<void>;
    };
    getFolder: () => Promise<string | null>;
  };
}
