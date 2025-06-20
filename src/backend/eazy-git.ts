import { exec } from "child_process";
export class EazyGit {
  constructor(cws: string) {
    this.cwd = cws;
  }
  private cwd: string;

  private gitCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${error.message}`);
        } else if (stderr) {
          reject(`Stderr: ${stderr}`);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }
  public async getCurrentBranch(): Promise<string> {
    try {
      const branchName = await this.gitCommand(
        "git rev-parse --abbrev-ref HEAD"
      );
      return branchName;
    } catch (error) {
      console.error(`Error getting current branch: ${error}`);
      throw error;
    }
  }
  public async showRef(): Promise<GitRef[]> {
    try {
      const refName = await this.gitCommand(`git show-ref`);
      return refName
        .split("\n")
        .map((line) => {
          const r =
            /^(\S+)\s+(refs\/(remotes|heads|tags|stash)(?:\/(.*))?)$/.exec(
              line
            );
          if (!r) {
            console.log(line);
            return null;
          }
          console.log(r);
          const [, hash, name, head, _name] = r;
          let remote = false;
          let type = head;
          switch (type) {
            case "remotes":
              type = "remote";
              remote = true;
              break;
            case "heads":
              type = "branch";
              break;
            case "tags":
              type = "tag";
              break;
            case "stash":
              type = "stash";
              break;
            default:
              type = "other";
              break;
          }
          if (/^HEAD ->/.test(name)) {
            type = "head";
          }
          return { name, hash, type, remote, _name };
        })
        .filter((ref) => ref);
    } catch (error) {
      console.error(`Error showing ref: ${error}`);
      throw error;
    }
  }
  public async getLog(options?: LogOptions): Promise<GitRef[]> {
    try {
      if (!options) options = { all: true, simplify: true };
      const { maxCount, skip, all, branches, tags, remotes, simplify } =
        options;
      const args = [
        "git log",
        '--pretty=format:"%H|%P|%D|%aI|%an|%s"',
        "--no-color",
      ];
      if (maxCount) args.push(`-n ${maxCount}`);
      if (skip) args.push(`--skip=${skip}`);
      if (all) args.push(`--all`);
      if (branches) args.push(`--branches`);
      if (tags) args.push(`--tags`);
      if (remotes) args.push(`--remotes`);
      if (simplify) args.push(`--simplify-by-decoration`);

      const log = await this.gitCommand(args.join(" "));
      const logs = log
        .split("\n")
        .map((line) => {
          const match =
            /^(\S+)\|([^|]+)?\|([^|]+)?\|(\S+)?\|([^|]+)?\|(.+)?$/.exec(line);
          if (!match) {
            console.log(line);
            return null;
          }
          const [, hash, parents, refs, date, author, subject] = match;
          return {
            hash,
            parents: parents
              ?.split(/\s+/)
              .map((parent) => parent.trim())
              .filter((parent) => parent),
            refs: refs
              ?.split(",")
              .map((ref) => ref.trim())
              .filter((ref) => ref),
            date,
            author,
            subject,
          };
        })
        .filter((log) => log);
      return logs;
    } catch (error) {
      console.error(`Error getting log: ${error}`);
      throw error;
    }
  }
}

export type LogOptions = {
  maxCount?: number;
  skip?: number;
  all?: boolean;
  branches?: boolean;
  tags?: boolean;
  remotes?: boolean;
  simplify?: boolean;
};
