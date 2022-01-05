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

module.exports = { waitToTime, waitToTimeSync };
