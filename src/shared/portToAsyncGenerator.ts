export function portToAsyncGenerator<T>(port: MessagePort): AsyncGenerator<T> {
  const queue: T[] = [];
  let resolver: ((value: IteratorResult<T>) => void) | null = null;
  let reject: ((reason?: any) => void) | null = null;
  let error: Error | null = null;
  let closed = false;
  port.onmessage = (event) => {
    const data = event.data;
    if (data.type === "data") {
      if (resolver) {
        resolver({ value: data.data, done: false });
        resolver = reject = null;
      } else {
        queue.push(data.data);
      }
    } else if (data.type === "error") {
      console.error("error", data.error);
      error = new Error(data.error.message);
      if (reject) {
        reject(error);
        resolver = reject = null;
      }
    }
  };
  port.addEventListener("close", () => {
    closed = true;
    if (resolver) {
      resolver({ value: undefined, done: true });
      resolver = null;
      reject = null;
    }
  });

  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      if (closed) {
        return { value: undefined, done: true };
      }
      if (error) {
        throw error;
      }
      if (queue.length > 0) {
        const value = queue.shift()!;
        return { value, done: false };
      }
      return new Promise<IteratorResult<T>>((res, rej) => {
        resolver = res;
        reject = rej;
      });
    },
    async return(value) {
      port.postMessage({ type: "return", value });
      return { value, done: true };
    },
    async throw(error) {
      port.postMessage({ type: "throw", error });
      return { value: undefined, done: true };
    },
    async [Symbol.asyncDispose]() {
      port.close();
      return Promise.resolve();
    },
  };
}
