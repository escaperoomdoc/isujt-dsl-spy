import {exit} from "process";
import {setInterval} from "timers";

import {logger} from "./app";
import {fsread} from "./app";
import {DslNode} from './dsl_node';

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
			if (!this.config.requestTimeout || this.config.requestTimeout < 5000) {
				this.config.requestTimeout = 5000;
			}
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
			if (Date.now() >= this.prevTime + this.config.requestTimeout) {
				console.log(`new job started after ${this.config.requestTimeout} ms...`);
				this.prevTime = Date.now();
				for (let node of this.nodes) {
					let hashes = await node.getHashes();
					if (hashes) console.log(`success requested from ${node.baseUrl}`);
					else console.log(`error in request from ${node.baseUrl}`);
				}
				this.getdiff();
			}
		}
		catch(error) {
			console.log(`job error: ${error}`);
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
			let hashList = storage[index];
			let prevhash: string | null = null;
			let diff: boolean = false;
			for (let nodeName in hashList) {
				let hash: string = hashList[nodeName];
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
