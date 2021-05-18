const winston = require('winston');
const {combine, timestamp, label, prettyPrint, simple, json} = winston.format;

export class Logger {
	private cfg: any;
	private logger: any;
	constructor(cfg: any) {
		this.cfg = cfg;
		this.logger = winston.createLogger({
			level: 'debug',
			//format: winston.format.json(),
			format: combine(
				label({ label: 'tinmine'}),
				timestamp(),
				simple()
			),
			defaultMeta: {service: 'tinmine-service'}
		});
		if (cfg.console) {
			this.logger.add(new winston.transports.Console());
		}
		if (cfg.files || cfg.file) {
			this.logger.add(new winston.transports.File({filename: 'combined.log'}));
		}
	}
	public log(level: string, message: string, payload: any) {
		try {
			//if (this.cfg.console) console.log(message + (payload ? JSON.stringify(payload) : ''));
			this.logger.log({
				level: level,
				message: message,
				pid: process.pid,
				payload: payload
			});
		}
		catch(error) {
			console.log('error in logger: ', error);
		}
	}
	public error(message: string, payload?: any | undefined) {
		this.log('error', message, payload);
	}
	public warn(message: string, payload?: any | undefined) {
		this.log('warn', message, payload);
	}
	public info(message: string, payload?: any | undefined) {
		this.log('info', message, payload);
	}
	public debug(message: string, payload?: any | undefined) {
		this.log('debug', message, payload);
	}
	/*
	process.on('uncaughtException', (e) => {
		that.error('uncaughtException: ' + e ? e.stack : '');
	});
	process.on('unhandledRejection', (reason, promise) => {
		that.error('unhandledRejection: ' + reason ? reason.stack : '');
	});
	*/
};

