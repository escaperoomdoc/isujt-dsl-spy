import {exit} from "process";
import {setInterval} from "timers";

import {logger} from "./app";
import {fsread} from "./app";
import {DslNode} from './dsl_node';

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
	nodes: Array<DslNode>;
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
				this.nodes.push(new DslNode(node));
			}
			setTimeout(() => this.job(), 10);
		}
		catch(error) {
		}		
	}	
	private async job() {
		try {
			if (Date.now() >= this.prevTime + 10000) {
				this.prevTime = Date.now();
				for (let node of this.nodes) {
					let hashes = await node.getHashes();
				}
				this.getdiff();
			}
		}
		catch(error) {
		}
		setTimeout(() => this.job(), 1000);
	}
	private getdiff() {
		let master = null;
		var report: any = {
			modules: {},
			classes: {}
		};
		for (let node of this.nodes) {
			if (node.master) master = node;
			for (let item in node.hashes.data.modules) {
				if (report.modules[item] === undefined) report.modules[item] = {};
				report.modules[item][node.name] = node.hashes.data.modules[item];
			}
			for (let item in node.hashes.data.clases) {
				if (report.classes[item] === undefined) report.classes[item] = {};
				report.classes[item][node.name] = node.hashes.data.clases[item];
			}
		}
		this.diffStorage(report.modules, 'modules');
		this.diffStorage(report.classes, 'classes');
	}
	private diffStorage(storage: any, name: string) {
		let count: number = 0;
		let total: number = 0;
		for (let index in storage) {
			total ++;
			let item = storage[index];
			let prevhash: string | null = null;
			let diff: boolean = false;
			for (let hashIndex in item) {
				let hash: string = item[hashIndex];
				if (prevhash && prevhash != hash) {
					diff = true;
					break;
				}
				prevhash = hash;
			}
			if (diff) count ++;
			else {
				delete storage[index];
			}
		}
		console.log(`diff count on ${name} = ${count} of ${total}`);
	}
}
