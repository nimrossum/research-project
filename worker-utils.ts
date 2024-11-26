export const generateWorkerFromScript = (code: string) =>
  new Worker(URL.createObjectURL(new File([code], "w.ts")));

export function streamFromWorkerScript<
  T,
  I extends {
    [Symbol.iterator]: () => IterableIterator<T>;
  }
>(code: string, data: I) {
  const worker = generateWorkerFromScript(code);

  const stream = new ReadableStream({
    start(controller) {
      console.log("Worker started");
      worker.onmessage = (event) => {
        controller.enqueue(event.data);
      };
      worker.onerror = (event) => {
        console.error("Worker error", event);
        controller.error(event);
      };
      worker.addEventListener("close", () => {
        console.log("Worker closed");
        controller.close();
      });
    },
    cancel() {
      worker.terminate();
      worker.onmessage = null;
      worker.onerror = null;
    },
  });

  for (const value of data) {
    worker.postMessage(value);
    worker.unref();
  }

  return { stream };
}

export function streamFromWorkerFile<
  T,
  I extends {
    [Symbol.iterator]: () => IterableIterator<T>;
  }
>(file: File, data: I) {
  const worker = new Worker(URL.createObjectURL(file));

  const stream = new ReadableStream({
    start(controller) {
      console.log("Worker started");
      worker.onmessage = (event) => {
        controller.enqueue(event.data);
      };
      worker.onerror = (event) => {
        console.error("Worker error", event);
        controller.error(event);
      };
      worker.addEventListener("close", () => {
        console.log("Worker closed");
        controller.close();
      });
    },
    cancel() {
      worker.terminate();
      worker.onmessage = null;
      worker.onerror = null;
    },
  });

  for (const value of data) {
    worker.postMessage(value);
  }
  worker.postMessage("DONE");

  return { stream };
}
