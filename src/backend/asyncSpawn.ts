import { spawn } from "child_process";
import readline from "node:readline/promises";

export async function* asyncSpawn(
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
        console.error(errorObj);
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
