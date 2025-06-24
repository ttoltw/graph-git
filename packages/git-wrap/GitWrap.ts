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
    refs?: GitRef[];
    date?: string;
    author?: string;
    subject?: string;
}

const typeOrder = ["", "branch", "remote", "tag", "stash", "commit", "other"];
export type GitRef = {
    name: string;
    hash: string;
    type: "tag" | "branch" | "stash" | "remote" | "head" | "commit" | "other" | string;
    remote?: false | string;
    current?: boolean;
    fullname?: string;
    order?: number;
}

type SortFn<T> = (a: T, b: T) => number;
function genMultiSort<T>(...sortFns: SortFn<T>[]): SortFn<T> {
    return (a, b) => {
        for (const sortFn of sortFns) {
            const result = sortFn(a, b)
            if (result !== 0) return result;
        }
        return 0;
    }
}

const sortRefFn = genMultiSort<GitRef>(
    (a, b) => a.order - b.order, // sort by type_order
    (a, b) => a.name.localeCompare(b.name), // sort by name desc
)

function parseGitLog(line: string): GitLog {
    const match =
        /^(\S+)\|([^|]+)?\|([^|]+)?\|(\S+)?\|([^|]+)?\|(.+)?$/.exec(line);
    if (!match) return null;
    const [, hash, parents, ref, date, author, subject] = match;
    const refs = ref?.split(",")
        .map((ref) => ref.trim())
        .filter((ref) => ref);

    return {
        hash,
        parents: parents
            ?.split(/\s+/)
            .map((parent) => parent.trim())
            .filter((parent) => parent),
        refs: refs?.map((ref) => parseGitRef(hash, ref)).sort(sortRefFn),
        date,
        author,
        subject,
    };
}
function parseGitRef(hash: string, ref: string): GitRef {
    if (!ref) return { hash, name: hash.substring(0, 7), type: "commit", fullname: hash, order: 999 };
    const [, head, prefix, name] = /^(?:(HEAD ->)|(?:tag:))?\s*refs\/(remotes|heads|tags|stash)(?:\/(.*))?$/.exec(
        ref
    ) || [];
    if (!prefix) return { hash, name: ref, type: "other", fullname: ref, order: 999 };
    let type = "other"
    let remote: false | string = false;
    switch (prefix) {
        case "remotes":
            type = "remote";
            remote = name.split("/")[0];
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
    }

    return {
        hash,
        name: name || ref,
        type,
        remote,
        current: !!head,
        fullname: ref,
        order: typeOrder.indexOf(type) || 999
    };
}
export class GitWrap {
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
            const { maxCount, skip, all, branches, tags, remotes, simplify } =
                options;
            const args = [
                "log",
                "--no-color",
                "--decorate=full",
                "--pretty=%H|%P|%D|%aI|%an|%s",
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
                const [, hash, ref] =
                    /^(\S+)\s+(.*)?$/.exec(
                        line
                    );
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
