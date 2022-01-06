const winston = require("winston");

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
        format.timestamp({ format: "H:mm:ss:ms" }),
        format.printf(
          (info) =>
            `${info.timestamp} - ${info.level.toUpperCase()}: ${info.message}`
        ),
        format.colorize({ all: true })
      ),
    }),
  ],
});

winston.addColors({
  success: "green",
  info: "cyan",
});

module.exports = logger;
