/// <reference types="vite/client" />
import type { GitLog } from '@g/git-wrap';

type Config = Record<string, unknown>;

declare global {
  declare const bridge: {
    git: {
      getLog: (folder: string) => Promise<GitLog[]>;
      fetch: (folder: string, remote?: string) => Promise<void>;
    };
    config: {
      get: () => Promise<Config>;
      set: (key: string, value: unknown) => Promise<void>;
    };
    getFolder: () => Promise<string | null>;
  };
}
