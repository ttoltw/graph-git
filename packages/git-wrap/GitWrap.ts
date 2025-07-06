import { LogOptions, GitLog, GitRef } from "./types";
import { parseGitLog, parseGitRef } from "./parsers";

export class GitWrap {
  private gitExecutor: (...args: string[]) => AsyncGenerator<string>;

  constructor(gitExecutor: (...args: string[]) => AsyncGenerator<string>) {
    this.gitExecutor = gitExecutor;
  }

  /**
   * Get the git version
   * @returns The git version
   */
  public async version(): Promise<string> {
    for await (const line of this.gitExecutor("version")) {
      return line;
    }
  }

  /**
   * Get the current branch name
   * @returns The current branch name
   */
  public async getCurrentBranch(): Promise<string> {
    try {
      for await (const branchName of this.gitExecutor("rev-parse", "--abbrev-ref", "HEAD")) {
        return branchName;
      }
    } catch (error) {
      console.error(`Error getting current branch: ${error}`);
      throw error;
    }
  }

  /**
   * Get the git log
   * @param options - The log options
   * @returns The git log
   */
  public async log(options?: LogOptions): Promise<GitLog[]> {
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

    for await (const line of this.gitExecutor(...args)) {
      const log = parseGitLog(line);
      if (!log) continue;
      logs.push(log);
    }
    return logs;
  }

  /**
   * Get the git refs
   * @returns The git refs
   */
  public async showRef(): Promise<GitRef[]> {
    try {
      const logs: GitRef[] = [];
      for await (const line of this.gitExecutor(`show-ref`)) {
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

  /**
   * Fetch the git remote
   * @param remote - The remote to fetch
   */
  public async fetch(remote?: string): Promise<void> {
    const args = ["fetch"];
    if (remote) {
      args.push(remote);
    }

    // Execute fetch command and wait for completion
    for await (const line of this.gitExecutor(...args)) {
      // Just consume the output, we don't need to process it
    }
  }
}
