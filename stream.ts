import { streamFromWorkerFile, streamFromWorkerScript } from "./worker-utils";
import worker from "./worker.ts" with { type: "file" }

const { stream } = streamFromWorkerFile(
  Bun.file(worker),
  "hello world"
);

// const { stream } = streamFromWorkerScript(
//   `
// self.onmessage = event => {
//   postMessage(event.data.toUpperCase());
// };
// `,
//   "hello world"
// );


for await (const value of stream) {
  console.log(`Received: ${value}`);
}

console.log("Stream done");

stream.cancel();
await stream.cancel();
