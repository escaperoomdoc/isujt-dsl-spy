import {exit} from "process";
import {setInterval} from "timers";
import {promisify} from "util";
import {logger} from "./app";
import {dsl} from "./app";
import * as fs from "fs";

/*
import redis from "redis";
const redisSelect = promisify(redisClient.select).bind(redisClient);
const redisFlushall = promisify(redisClient.flushall).bind(redisClient);
const redisFlushdb = promisify(redisClient.flushdb).bind(redisClient);
const redisPing = promisify(redisClient.ping).bind(redisClient);
const redisKeys = promisify(redisClient.keys).bind(redisClient);
const redisGet = promisify(redisClient.get).bind(redisClient);
const redisSet = promisify(redisClient.set).bind(redisClient);
const redisDel = promisify(redisClient.del).bind(redisClient);
const redisExpire = promisify(redisClient.expire).bind(redisClient);
const redisHset = promisify(redisClient.hset).bind(redisClient);
const redisHget = promisify(redisClient.hget).bind(redisClient);
const redisHgetall = promisify(redisClient.hgetall).bind(redisClient);
*/

const sleep = promisify(setTimeout);
const fsread = promisify(fs.readFile)

export class Spy {
	currentTime: string;
	config: any;
	constructor() {
		this.currentTime = '';
		try {
			this.config = await fsread('./config.json');
			setInterval(() => this.updateTime(), 1000);
		}
		catch(error) {

		}
	}
	private updateTime() {
		this.currentTime = new Date(Date.now()).toISOString();
	}
	private async updateAccount() {
		try {
			logger.info('validating account...');
			if (!process.env.MARKET_ACCOUNT || typeof process.env.MARKET_ACCOUNT !== 'string') {
				logger.error('process.env.MARKET_ACCOUNT failed, terminating...');
				exit(1);
			}
			await redisSelect(0);
			let account: any = await redisGet('account');
			if (!account || account != process.env.MARKET_ACCOUNT) {
				logger.info('account validation failed, flushing all...');
				await redisFlushall();
				await redisSet('account', process.env.MARKET_ACCOUNT as string);
			}
			else logger.info('found existing account, trying to restore data...');
		}
		catch(error) {
			throw error;
		}
	}	
	private async updatePortfolio() {
		try {
			logger.info('get actual portfolio...');
			let portfolio = await tinapi.portfolio();
			if (portfolio.status !== 'ok') {
				throw 'tinapi: get portfolio error, force restart...';
			}			
			await redisSelect(0);
			await redisSet('portfolio', JSON.stringify(portfolio.payload));
		}
		catch(error) {
			throw error;
		}
	}
	private async clearOutdated() {
		try {
			logger.info('clear outdated epochs...');
			let nowTime: Date = new Date(this.currentTime);
			let clearTime: Date = new Date(nowTime.getTime() - this.clearWindow * 3600000 - 60000);
			await redisSelect(2);
			let keys = await redisKeys('*');
			for (let key of keys) {
				let timeString: string = this.redis2tinTime(key);
				let keyDate = new Date(timeString);
				if (keyDate < clearTime) {
					logger.info(`clearing ${key} epoch (now=${this.currentTime}, window=${this.clearWindow})`);
					await new Promise((resolve, reject) => {
						redisClient.del(key, (result) => {true ? resolve(null) : reject()});
					})
				}
			}
		}
		catch(error) {
			logger.info('clearOutdated error');
		}
	}
	private async updateStocks() {
		try {
			logger.info('get actual stocks...');
			let stocks = await tinapi.stocks();
			if (stocks.status !== 'ok') {
				throw 'tinapi: get stocks error, force restart...';
			}
			//stocks.payload.instruments.splice(64, stocks.payload.instruments.length - 64); // <----- temp for debug
			logger.info(`received ${stocks.payload.instruments.length} instruments, actualizing stocks storage...`);
			var handledInstrumentsCount: number = 0;
			var skippedInstrumentsCount: number = 0;
			for (var instrument of stocks.payload.instruments) {
				//if (instrument['figi'] !== 'BBG000B9XRY4') continue; // <----- temp for debug
				// set default time window
				let nowTime: Date = new Date(this.currentTime);
				let fromTime: Date = new Date(nowTime.getTime() - this.hoursWindow * 3600000);
				// check if redis stored instrument contains more actual date
				await redisSelect(1);
				let redisInstrumentText: any = await redisGet(instrument['figi']);
				if (redisInstrumentText) {
					let redisInstrument = JSON.parse(redisInstrumentText);
					if (redisInstrument.refreshTime) {
						let refreshTime: Date = new Date(redisInstrument.refreshTime);
						if (refreshTime >= fromTime && refreshTime <= nowTime) {
							fromTime = refreshTime;
						}
					}
				}
				let delta: number = nowTime.getTime() - fromTime.getTime();
				if (delta <= 60000) {
					skippedInstrumentsCount++;
					logger.debug(`figi ${instrument['figi']} is skipped (not actual), progress = ${Math.floor((skippedInstrumentsCount+handledInstrumentsCount)*100/stocks.payload.instruments.length)}%`);
					continue;
				}
				let fromTimeString: string = fromTime.toISOString();
				let nowTimeString: string = nowTime.toISOString();
				var result: any = await tinapi.candles({
					figi: instrument['figi'],
					from: fromTimeString,
					to: nowTimeString,
					interval: '1min'
				});
				if (result.error) {
					if (result.error == 'too much requests') {
						console.log('too much requests, waiting 20 seconds...');
						await sleep(20000);
						continue;
					}
					console.log('unknown error, finilizing!');
					break;
				}
				try {
					await redisSelect(2);
					for (var candle of result.payload.candles) {
						let redisTime = this.tin2redisTime(candle.time);
						let r = await redisHset([redisTime, candle.figi, JSON.stringify(candle)]);
						redisExpire(redisTime, 36 * 3600);
						instrument.changeTime = candle.time;
					}
					instrument.refreshTime = nowTimeString;
					await redisSelect(1);
					await redisSet(instrument['figi'], JSON.stringify(instrument));
					handledInstrumentsCount++;
					logger.debug(`figi ${instrument['figi']} is handled, progress = ${Math.floor((skippedInstrumentsCount+handledInstrumentsCount)*100/stocks.payload.instruments.length)}%`);
				}
				catch(error) {
					logger.warn(`error occured on '${instrument['figi']}' instrument handler`);
				}
			}
			logger.info(`stocks updated: total=${stocks.payload.instruments.length}, handled=${handledInstrumentsCount}, skipped=${skippedInstrumentsCount}`);
		}
		catch(error) {
			throw error;
		}
	}	
	public async job() {
		try {
			logger.info('miner started the job...');
			await this.updateAccount();
			await this.updatePortfolio();
			await this.clearOutdated();
			await this.updateStocks();
		}
		catch(error) {
			logger.error(error);
		}
		logger.info('miner finished the job, retsart mining cycle in 10 seconds');
		setTimeout(() => this.job(), 10000);
	}
	public async run() {
		try {
			logger.info('miner started');
			let ping = await redisPing();
			if (ping !== 'PONG') throw 'no redis ping/pong';
			await new Promise((resolve, reject) => {
				redisClient.config('set', 'save', '', (result) => {true ? resolve(null) : reject()});
			})
			await new Promise((resolve, reject) => {
				redisClient.config('set', 'appendonly', 'no', (result) => {true ? resolve(null) : reject()});
			})			
			this.job();
		}
		catch(error) {
			logger.error(error);
			logger.info('next mining retsart mining is sheduled in 10 seconds');
			setTimeout(() => this.run(), 10000);
		}
	}	
	public state() {
		return {
			currentTime: this.currentTime,
			simulation: this.simulation,
			hoursWindow: this.hoursWindow
		}
	}
	public alive() {
		this.simulation = null;
	}
	public play(koef?: number | null) {
		this.simulation = 'play';
		if (koef && koef >= 1 && koef <= 100) this.simulationKoef = koef;
	}
	public stop() {
		this.simulation = 'stop';
	}
}
