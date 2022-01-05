const waitToTime = (timestamp) =>
  new Promise((resolve) => {
    const interval = setInterval(() => {
      const now = Date.now();

      if (now >= timestamp) {
        resolve(now);
        clearInterval(interval);
      }
    });
  });

const waitToTimeSync = (timestamp) => {
  while (true) {
    const now = Date.now();

    if (now >= timestamp) {
      return now;
    }
  }
};

const wait = (ms) =>
  new Promise((r) => {
    setTimeout(() => r(), ms);
  });

const randomRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1) + min);

module.exports = { waitToTime, waitToTimeSync, wait, randomRange };
