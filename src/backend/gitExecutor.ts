import { Mutex } from "@g/mutex";
import { asyncSpawn } from "./asyncSpawn";
const lock = new Mutex();
let cwd: string | null = null;

export async function* gitExecutor(...args: string[]): AsyncGenerator<string> {
  const release = await lock.acquire();
  try {
    yield* asyncSpawn("git", args, { cwd });
  } finally {
    release();
  }
}

export function setCwd(folder: string) {
  if (folder && folder !== cwd) {
    cwd = folder;
    return true;
  } else {
    return false;
  }
}
