const cliProgress = require("cli-progress");
const clc = require("cli-color");

const startTimeProgressBar = (startTime, intervalUpdate = 1000) => {
  const bar = new cliProgress.SingleBar(
    {
      format: clc.green("{bar} {percentage}% ETA: {eta_formatted}"),
    },
    cliProgress.Presets.shades_classic
  );

  const diff = startTime - Date.now();

  bar.start(diff, 0);

  const interval = setInterval(() => {
    const now = Date.now();

    bar.update(diff - (startTime - now));

    if (now >= startTime) {
      clearInterval(interval);
      bar.stop();
      return;
    }
  }, intervalUpdate);
};

module.exports = startTimeProgressBar;
