export const sleep = (timeMs: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, timeMs);
  });
};
