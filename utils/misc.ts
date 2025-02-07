export function time<A extends readonly unknown[], R>(
  fn: (...args: A) => R
): (...args: A) => R {
  return (...args: A) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    !global.silent &&
      console.log(
        `⏳ ${(end - start).toFixed(2)}ms [${
          fn.name.length > 0 ? fn.name : "anonymous"
        }]`
      );
    return result;
  };
}

export const inspect: <T>(d: T) => T = (d) => {
  console.dir(d, { depth: null });
  return d;
};

export function formatMsTime(time: number) {
  let unit = "ms";
  if (time < 1000) {
    return `${time.toFixed(2)}${unit}`;
  }
  time /= 1000;
  if (time < 60) {
    unit = "s";
    return `${time.toFixed(2)}${unit}`;
  }
  time /= 60;
  if (time < 60) {
    unit = "m";
    return `${time.toFixed(2)}${unit}`;
  }
  time /= 60;
  if (time < 24) {
    unit = "h";
    return `${time.toFixed(2)}${unit}`;
  }
  time /= 24;
  unit = "d";
  return `${time.toFixed(2)}${unit}`;
}

export const katch: <T>(
  p: Promise<T>
) => Promise<[T, null] | [null, unknown]> = async (p) => {
  try {
    return [await p, null];
  } catch (e) {
    return [null, e];
  }
};
