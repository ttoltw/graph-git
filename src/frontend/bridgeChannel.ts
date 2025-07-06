const gitStreams = new Map<string, ((data: MessagePort) => void) | MessagePort>();

window.addEventListener("message", (event) => {
  if (event.data.type === "git:stream") {
    const { streamid } = event.data;
    const port = event.ports[0];
    const resolver = gitStreams.get(streamid);
    if (typeof resolver === "function") {
      gitStreams.delete(streamid);
      resolver(port);
    } else {
      gitStreams.set(streamid, port);
    }
  }
});

export async function getGitStream(streamid: string): Promise<MessagePort> {
  const resolver = gitStreams.get(streamid);
  if (resolver && typeof resolver !== "function") {
    gitStreams.delete(streamid);
    return resolver;
  }
  return new Promise<MessagePort>((resolve) => {
    gitStreams.set(streamid, resolve);
  });
}
