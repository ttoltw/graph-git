import { spawn } from "node:child_process";
import readline from "node:readline/promises";
import { Mutex } from "@g/mutex";

export type LogOptions = {
    maxCount?: number;
    skip?: number;
    all?: boolean;
    branches?: boolean;
    tags?: boolean;
    remotes?: boolean;
    simplify?: boolean;
};

export type GitLog = {
    hash: string;
    parents?: string[];
    refs?: string[];
    date?: string;
    author?: string;
    subject?: string;
}

export type GitRef = {
    name: string;
    hash: string;
    type: "tag" | "branch" | "stash" | "remote" | "head" | "other" | string;
    remote?: boolean;
    _name?: string;
}
export default class GitWrap {
    private cwd: string;
    private static lock = new Mutex();
    constructor(cwd: string) {
        this.cwd = cwd;
    }

    async * raw(...args: string[]): AsyncGenerator<string> {
        yield* GitWrap.raw(this.cwd, args);
    }

    static async * raw(cwd: string, args: string[]): AsyncGenerator<string> {
        const release = await GitWrap.lock.acquire();
        try {
            yield* asyncSpawn("git", args, { cwd });
        } finally {
            release();
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
            const { maxCount, skip, all, branches, tags, remotes, simplify } =
                options;
            const args = [
                "log",
                "--pretty=format:%H|%P|%D|%aI|%an|%s",
                "--no-color",
            ];
            if (maxCount) args.push(`-n`, `${maxCount}`);
            if (skip) args.push(`--skip=${skip}`);
            if (all) args.push(`--all`);
            if (branches) args.push(`--branches`);
            if (tags) args.push(`--tags`);
            if (remotes) args.push(`--remotes`);
            if (simplify) args.push(`--simplify-by-decoration`);
            const logs = [];

            for await (const line of this.raw(...args)) {
                const match =
                    /^(\S+)\|([^|]+)?\|([^|]+)?\|(\S+)?\|([^|]+)?\|(.+)?$/.exec(line);
                if (!match) continue;
                const [, hash, parents, refs, date, author, subject] = match;
                logs.push({
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
                });
            }
            return logs;
        } catch (error) {
            console.error(`Error getting log: ${error}`);
            throw error;
        }
    }

    public async showRef(): Promise<GitRef[]> {
        try {
            const logs = [];
            for await (const line of this.raw(`show-ref`)) {
                const r =
                    /^(\S+)\s+(refs\/(remotes|heads|tags|stash)(?:\/(.*))?)$/.exec(
                        line
                    );
                if (!r) {
                    console.log(line);
                    continue;
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
                logs.push({ name, hash, type, remote, _name });
            }
            return logs;
        } catch (error) {
            console.error(`Error showing ref: ${error}`);
            throw error;
        }
    }
}

async function* asyncSpawn(command: string, args: string[], options: { cwd: string, env?: Record<string, string> }): AsyncGenerator<string> {
    const p = spawn(command, args, { cwd: options.cwd, env: options.env ?? {} });
    const rl = readline.createInterface({
        input: p.stdout,
        terminal: false,
    });
    const errorResult: Buffer[] = [];
    let errorObj: unknown;
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
