import { ipcMain } from "electron";

/// = Stream channels =///

export type AsyncGeneratorHandler<TData = unknown> = (...args: unknown[]) => AsyncGenerator<TData>;

export type StreamMessage<TData = unknown> =
  | { type: "data"; data: TData }
  | { type: "error"; error: { message: string; stack?: string } }
  | { type: "return"; data: TData }
  | { type: "throw"; error: Error };

export function registerStreamChannel<TData = unknown>(
  channel: string,
  handler: AsyncGeneratorHandler<TData>,
) {
  ipcMain.on(channel, async (event, ...args) => {
    const port = event.ports[0];

    // Check if port exists
    if (!port) {
      console.error(`No MessagePort available for channel: ${channel}`);
      return;
    }

    port.start();
    let gen: AsyncGenerator<TData> | null = null;

    const postMessage = (message: StreamMessage<TData>) => {
      try {
        port.postMessage(message);
      } catch (err) {
        console.error(`Failed to send message for channel '${channel}':`, err);
      }
    };
    try {
      gen = handler(...args);

      // Handle port close event
      port.on("close", () => {
        if (!gen) return;
        gen.return(null).catch((err) => {
          console.error(`Error during generator cleanup for channel '${channel}':`, err);
        });
      });
      // Handle control messages from renderer
      port.on("message", (event) => {
        if (!gen) return;
        const message = event?.data as StreamMessage<TData>;

        if (message.type === "return") {
          gen.return(message.data).catch((err) => {
            console.error(`Error during generator return for channel '${channel}':`, err);
          });
        } else if (message.type === "throw") {
          gen.throw(message.error).catch((err) => {
            console.error(`Error during generator throw for channel '${channel}':`, err);
          });
        }
      });

      // Stream data from generator to port
      for await (const data of gen) {
        postMessage({ type: "data", data });
      }
      gen = null;
    } catch (err) {
      console.error(`Error in stream channel '${channel}':`, err);
      postMessage({
        type: "error",
        error: {
          message: err.message ?? "Unknown error",
          stack: err.stack,
        },
      });
    } finally {
      port.close();
    }
  });
}
