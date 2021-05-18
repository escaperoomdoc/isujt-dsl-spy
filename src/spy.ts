import {exit} from "process";
import {setInterval} from "timers";
import {promisify} from "util";
import {logger} from "./app";
import {Dsl} from './dsl';
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
	prevTime: number;
	dsl: Array<Dsl>;
	config: any;
	constructor() {
		this.prevTime = Date.now();
		this.dsl = [];
		try {
			setTimeout(() => this.init(), 10);
		}
		catch(error) {
		}
	}
	private async init() {
		try {
			this.config = await fsread('./config.json');
			for (let node of this.config.nodes) {
				this.dsl.push(new Dsl(node));
			}
			this.control();
		}
		catch(error) {
		}		
	}	
	private async control() {
		try {
			if (Date.now() >= this.prevTime + 60000) {
				this.prevTime = Date.now();
				for (let dsl of this.dsl) {
					let md5 = await dsl.md5();
				}
			}
		}
		catch(error) {
		}
		setTimeout(() => this.control(), 1000);
	}
}
