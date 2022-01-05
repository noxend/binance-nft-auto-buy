const cliProgress = require("cli-progress");
const clc = require("cli-color");

// create a new progress bar instance and use shades_classic theme
const bar1 = new cliProgress.SingleBar({
  format: clc.blueBright("{bar} {percentage}% ETA: {eta_formatted}"),
  barCompleteChar: "\u2588",
  barIncompleteChar: "\u2591",
  hideCursor: true,
});

const endDate = 1641292235000;
const diff = endDate - Date.now();

bar1.start(diff, 0);

const interval = setInterval(() => {
  const now = Date.now();

  bar1.update(diff - (endDate - now));

  if (now >= endDate) {
    clearInterval(interval);
    bar1.stop();
    return;
  }
}, 1);
