/// <reference types="vite/client" />
import type { GitLog } from "@g/git-wrap";

type Config = Record<string, unknown>;

declare global {
  declare const bridge: {
    git: {
      exec: (args: string[] = []) => Promise<string>;
    };
    config: {
      get: () => Promise<Config>;
      set: (key: string, value: unknown) => Promise<void>;
    };
    getFolder: () => Promise<string | null>;
  };
}
