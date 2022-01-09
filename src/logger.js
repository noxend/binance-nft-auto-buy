const winston = require("winston");
const clc = require("cli-color");

const { format, transports } = winston;

const logger = winston.createLogger({
  levels: {
    error: 0,
    warn: 1,
    success: 2,
    info: 3,
  },
  transports: [
    new transports.Console({
      format: format.combine(
        format((info) => {
          info.level = info.level.toUpperCase();
          return info;
        })(),
        format.colorize({
          level: true,
        }),
        format.timestamp({
          format: "HH:mm:ss:ms",
        }),
        format.printf(
          (info) =>
            `[${info.timestamp}] ${info.level}: ${clc.cyan(info.message)}`
        )
      ),
    }),
  ],
});

winston.addColors({
  success: "green",
  info: "cyan",
});

module.exports = logger;
