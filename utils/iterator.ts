export const asyncIteratorToArray = async <T>(
  iterator: AsyncIterable<T>
): Promise<T[]> => {
  const result: T[] = [];
  for await (const item of iterator) {
    result.push(item);
  }
  return result;
};
