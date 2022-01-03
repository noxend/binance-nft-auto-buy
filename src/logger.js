const winston = require("winston");

const { format, transports } = winston;

const logger = winston.createLogger({
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
	error: "red",
	warn: "yellow",
	info: "cyan",
	debug: "green",
});

module.exports = logger;
