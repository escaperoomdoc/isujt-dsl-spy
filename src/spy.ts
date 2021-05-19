import {exit} from "process";
import {setInterval} from "timers";

import {logger} from "./app";
import {fsread} from "./app";
import {Dsl} from './dsl';

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



export class Spy {
	prevTime: number;
	nodes: Array<Dsl>;
	config: any;
	constructor() {
		this.prevTime = 0;
		this.nodes = [];
	}
	async run() {
		try {
			let cfg = (await fsread('./config.json')).toString();
			this.config = JSON.parse(cfg);
			for (let node of this.config.nodes) {
				this.nodes.push(new Dsl(node));
			}
			setTimeout(() => this.job(), 10);
		}
		catch(error) {
		}		
	}	
	private async job() {
		try {
			if (Date.now() >= this.prevTime + 60000) {
				this.prevTime = Date.now();
				for (let node of this.nodes) {
					let md5 = await node.md5();
					let aaa = 0;
				}
			}
		}
		catch(error) {
		}
		setTimeout(() => this.job(), 1000);
	}
}
