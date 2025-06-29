import { spawn } from "node:child_process";
import readline from "node:readline/promises";
import { Mutex } from "@g/mutex";
import { LogOptions, GitLog, GitRef } from "./types";
import { parseGitLog, parseGitRef } from "./parsers";

export class GitWrap {
  private cwd: string;
  private static lock = new Mutex();
  constructor(cwd: string) {
    this.cwd = cwd;
  }

  async *raw(...args: string[]): AsyncGenerator<string> {
    const release = await GitWrap.lock.acquire();
    try {
      yield* asyncSpawn("git", args, { cwd: this.cwd });
    } finally {
      release();
    }
  }
  public async version(): Promise<string> {
    for await (const line of this.raw("version")) {
      return line;
    }
  }
  public async getCurrentBranch(): Promise<string> {
    try {
      for await (const branchName of this.raw("rev-parse", "--abbrev-ref", "HEAD")) {
        return branchName;
      }
    } catch (error) {
      console.error(`Error getting current branch: ${error}`);
      throw error;
    }
  }
  public async log(options?: LogOptions): Promise<GitLog[]> {
    try {
      if (!options) options = { all: true, simplify: true };
      const { maxCount, skip, all, branches, tags, remotes, simplify } = options;
      const args = ["log", "--no-color", "--decorate=full", "--pretty=%H|%P|%D|%aI|%an|%s"];
      if (maxCount) args.push(`-n`, `${maxCount}`);
      if (skip) args.push(`--skip=${skip}`);
      if (all) args.push(`--all`);
      if (branches) args.push(`--branches`);
      if (tags) args.push(`--tags`);
      if (remotes) args.push(`--remotes`);
      if (simplify) args.push(`--simplify-by-decoration`);
      const logs = [];

      for await (const line of this.raw(...args)) {
        const log = parseGitLog(line);
        if (!log) continue;
        logs.push(log);
      }
      return logs;
    } catch (error) {
      console.error(`Error getting log: ${error}`);
      throw error;
    }
  }

  public async showRef(): Promise<GitRef[]> {
    try {
      const logs: GitRef[] = [];
      for await (const line of this.raw(`show-ref`)) {
        const [, hash, ref] = /^(\S+)\s+(.*)?$/.exec(line);
        if (!hash) {
          continue;
        }
        logs.push(parseGitRef(hash, ref));
      }
      return logs;
    } catch (error) {
      console.error(`Error showing ref: ${error}`);
      throw error;
    }
  }

  public async fetch(remote?: string): Promise<void> {
    const args = ["fetch"];
    if (remote) {
      args.push(remote);
    }

    // Execute fetch command and wait for completion
    for await (const line of this.raw(...args)) {
      // Just consume the output, we don't need to process it
      console.log(`[fetch] ${line}`);
    }
  }
}

async function* asyncSpawn(
  command: string,
  args: string[],
  options: { cwd: string; env?: Record<string, string> },
): AsyncGenerator<string> {
  const p = spawn(command, args, { cwd: options.cwd, env: options.env ?? {} });
  const rl = readline.createInterface({
    input: p.stdout,
    terminal: false,
  });
  const errorResult: Buffer[] = [];
  let errorObj: unknown;
  p.stderr.on("data", (chunk) => {
    errorResult.push(chunk);
  });
  p.on("error", (error) => {
    errorObj = error;
  });
  const resultPromise = new Promise<void>((resolve, reject) => {
    p.on("close", (code) => {
      if (code !== 0) {
        if (errorResult.length) {
          errorObj = new Error(Buffer.concat(errorResult).toString());
        } else if (errorObj instanceof Error) {
          // errorObj = errorObj;
        } else {
          errorObj = new Error(errorObj ? String(errorObj) : `unknown error, code:${code}`);
        }
        reject(errorObj);
      } else {
        resolve();
      }
    });
  });
  for await (const line of rl) {
    yield line;
  }
  await resultPromise;
}
