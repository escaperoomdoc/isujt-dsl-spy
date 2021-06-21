import {exit} from 'process';
import {setInterval} from 'timers';
import {logger} from './app';
import {fsread} from './app';
import {fswrite} from './app';
import {DslNode} from './dsl_node';
import * as ejs from 'exceljs';
import * as scheduler from "node-schedule";
import {pget} from "./prequest";
import {ppost} from "./prequest";
import {Telegraf} from 'telegraf';
import {HttpsProxyAgent} from 'https-proxy-agent';

export class Spy {
	nodes: Array<DslNode>;
	config: any;
	schedulerJob: scheduler.Job | null;
	bot: Telegraf | null;
	jobEngaged: boolean;
	constructor() {
		this.nodes = [];
		this.schedulerJob = null;
		this.bot = null;
		this.jobEngaged = false;
	}
	async run() {
		try {
			let cfg = (await fsread('./config.json')).toString();
			this.config = JSON.parse(cfg);
			console.log('isujt-dsl-spy application started...');
			if (!this.config.requestTimeout || this.config.requestTimeout < 5000) {
				this.config.requestTimeout = 5000;
			}
			for (let node of this.config.nodes) {
				this.nodes.push(new DslNode(node, this.config.files));
			}
			if (this.config.scheduler.enabled) {
				this.schedulerJob = scheduler.scheduleJob(this.config.scheduler.mask, () => {
					this.job();
				});				
			}
			if (this.config.runJobOnStartup) {
				setTimeout(() => this.job(), 10);
			}
			setTimeout(() => this.tasks(), 10);
			if (this.config.telegram.enabled) {
				if (this.config.proxy.enabled) {
					this.bot = new Telegraf(this.config.telegram.token, {
						telegram: {
						  agent: new HttpsProxyAgent(this.config.proxy.url)
						}
					})
				}
				else this.bot = new Telegraf(this.config.telegram.token);
				if (this.bot) {
					this.bot.start(async ctx => {
						try {
							ctx.reply(`isujt-dsl-spy: bot started at the telegram chat ${ctx.message.chat.id}`);
							console.log(`isujt-dsl-spy bot started at the telegram chat ${ctx.message.chat.id}`);
						}
						catch(error) {
							console.log(error);
						}
					})
					this.bot.command('dsl', async ctx => {
						try {
							if (this.jobEngaged) throw 'job is engaged'
							this.jobEngaged = true;
							let cmd = ctx.update.message.text.split(' ');
							if (cmd[1] === 'ping') {
								ctx.reply('dsl: pong');
							}
							if (cmd[1] === 'update') {
								ctx.reply('dsl: update job started...');
								for (let node of this.nodes) {
									if (!cmd[2] || cmd[2] === node.name) {
										await this.requestHashes(node);
									}
								}
								await this.handleResults();
							}
							if (cmd[1] === 'diff') {
							}							
						}
						catch(error) {
							let error_string: string = 'dsl error: ';
							if (typeof error === 'string') error_string += error;
							else error_string += 'smth goes wrong :('
							console.log(error);
							ctx.reply(error_string);
						}
						this.jobEngaged = false;
					})					
					this.bot.launch();
					process.once('SIGINT', () => (this.bot as Telegraf).stop('SIGINT'));
					process.once('SIGTERM', () => (this.bot as Telegraf).stop('SIGTERM'));
				}
			}
		}
		catch(error) {
			console.log(error);
		}
	}	
	private async job() {
		try {
			console.log(`new job started...`);
			for (let node of this.nodes) {
				await this.requestHashes(node);
			}
			await this.handleResults();
		}
		catch(error) {
			console.log(`job error: ${error}`);
		}
	}
	private async requestHashes(node: DslNode) {
		try {
			console.log(`requesting hashes from ${node.name}: ${node.baseUrl}...`);
			let hashes = await node.getHashes();
			if (hashes) {
				node.timeofHashes = Date.now();
				console.log(`success request from ${node.name}: ${node.baseUrl}`);
			}
			else throw `error in request from ${node.name}: ${node.baseUrl}`;
			if (this.config.server && this.config.server.enabled) {
				await this.forwardHashes(node);
				console.log(`success forwarding to ${this.config.server.urlForwarding}`);
			}
		}
		catch(error) {
			console.log(error)
		}
	}
	private async forwardHashes(node: DslNode) {
		try {
			var files: any = {};
			if (node.hashes.data.file)
			for (let item of node.hashes.data.file) {
				if (!Array.isArray(item)) throw 'not array file-object detected';
				if (files[item[0]] === undefined) files[item[0]] = {};
				files[item[0]] = item[1];
			}
			let data = {
				method: 'hashmap',
				name: node.name,
				payload: {
					modules: node.hashes.data.modules,
					classes: node.hashes.data.classes,
					files: files
				}
			};
			//await fswrite('test.json', JSON.stringify(data));
			//let result: any = await axios.post(endpoint, data, {httpsAgent: httpsAgent});
			let result: any = await ppost(this.config.server.urlForwarding, JSON.stringify(data), this.config.proxy.enabled ? this.config.proxy.url : null);
		}
		catch(error) {
			console.log(error);
		}		
	}
	private async tasks() {
		if (!this.config.server || !this.config.server.enabled) {
			return;
		}
		try {
			//let result: any = await axios.get(this.config.server.urlTasks, {httpsAgent: httpsAgent});
			let result: any = await pget(this.config.server.urlTasks, this.config.proxy.enabled ? this.config.proxy.url : null);
			let tasks = JSON.parse(result.body);
			for (let task of tasks.tasks) {
				if (task.task === 'get-module') {
					console.log(`received task '${task.task}': ${task.name}`);
					let data: any = {
						method: 'content',
						type: 'module',
						name: task.name,
						payload: {}
					};
					for (let node of this.nodes) {
						console.log(`loading script '${node.name}': ${task.name}...`);
						let scriptResult: any = await node.getScript(task.name);
						data.payload[node.name] = scriptResult && scriptResult.data ? scriptResult.data : null;
					}
					//await fswrite('test.json', JSON.stringify(data));
					//let result: any = await axios.post(this.config.server.urlForwarding, data, {httpsAgent: httpsAgent});
					console.log(`forwarding scripts to server ${this.config.server.urlForwarding}...`);
					let result: any = await ppost(this.config.server.urlForwarding, JSON.stringify(data), this.config.proxy.enabled ? this.config.proxy.url : null);
					console.log(`handled task '${task.task}': ${task.name}`);
				}
				if (task.task === 'get-hash') {
					for (let node of this.nodes) {
						if (!task.name || task.name === 'null' || task.name === node.name) {
							await this.requestHashes(node);
						}
					}					
				}
			}
		}
		catch(error) {
			console.log(error);
		}
		setTimeout(() => this.tasks(), this.config.server.tasksTimeout);
	}
	private async handleResults() {
		let master = null;
		var report: any = {
			modules: {},
			classes: {},
			files: {}
		};
		for (let node of this.nodes) {
			if (node.hashes.data.modules)
			for (let item in node.hashes.data.modules) {
				if (report.modules[item] === undefined) report.modules[item] = {};
				report.modules[item][node.name] = node.hashes.data.modules[item];
			}
			if (node.hashes.data.classes)
			for (let item in node.hashes.data.classes) {
				if (report.classes[item] === undefined) report.classes[item] = {};
				report.classes[item][node.name] = node.hashes.data.classes[item];
			}
			if (node.hashes.data.file)
			for (let item of node.hashes.data.file) {
				if (!Array.isArray(item)) throw 'not array file-object detected';
				if (report.files[item[0]] === undefined) report.files[item[0]] = {};
				report.files[item[0]][node.name] = item[1];
			}			
		}
		if (this.config.excelReport) {
			await this.excelReport(report);
			await this.botMailing();
		}
	}
	private async botMailing() {
		if (!this.bot) return;
		try {
			let chatsArray = this.config.telegram.chats;
			let now = new Date();
			let data: any = await fsread('./report.xlsx');
			for (const chat of chatsArray) {
				//let msg: string = now.toString() + ': new report generated';
				//await this.bot.telegram.sendMessage(chat, msg);
				await this.bot.telegram.sendDocument(chat, {
					source: data,
					filename: './isujt-dsl-files-report.xlsx'
				});
			}
		}
		catch(error) {
			console.log(error);
		}
	}
	private async excelReport(report: any) {
		try {
			const workbook = new ejs.Workbook();
			this.excelReportSheet(workbook, report.modules, 'modules');
			this.excelReportSheet(workbook, report.classes, 'classes');
			this.excelReportSheet(workbook, report.files, 'files');
			await workbook.xlsx.writeFile('report.xlsx');
			console.log('excel report successfuly generated');
			if (this.config.exitOnJobFinished) exit();
		}
		catch(error) {
		}
	}
	private async excelReportSheet(workbook: ejs.Workbook, storage: any, sheetName: string) {
		const sheet = workbook.addWorksheet(sheetName);
		try {
			// set header
			let columnIndex = 1;
			sheet.getColumn(columnIndex).width = 40;
			sheet.getColumn(columnIndex).header = sheetName;
			for (let node of this.config.nodes) {
				columnIndex ++;
				let column = sheet.getColumn(columnIndex);
				column.header = node.name;
				column.width = 30;
			}
			for (let i = 0; i < columnIndex; i ++) {
				sheet.getRow(1).getCell(i + 1).font = {
					name: 'Arial Black',
					color: { argb: 'FF000040' },
					family: 2,
					size: 14
				}
			}
			// set values
			let rowIndex = 2;
			columnIndex = 0;
			let font = {
				name: 'Arial',
				color: { argb: 'FF800080' },
				family: 2,
				size: 8,
				bold: true
			}
			let row = sheet.getRow(rowIndex);
			let cell = row.getCell(++columnIndex);
			cell.value = '';
			cell.font = font;
			for (let node of this.nodes) {
				let cell = row.getCell(++columnIndex);
				let dt: Date = new Date(node.timeofHashes - new Date().getTimezoneOffset() * 60000);
				cell.value = dt.toISOString();
				cell.font = font;
			}
			// set values
			rowIndex = 2;
			for (let node of this.config.nodes) {
				node.diffs = 0;
			}
			let sortedArray: any = this.sortStorage(storage);
			for (let index in sortedArray) {
				let hashList = sortedArray[index].hashList;
				let itemName: string = sortedArray[index].name;
				let diffs: number = sortedArray[index].diffs;
				let row = sheet.getRow(++rowIndex);
				columnIndex = 1;
				let color = 'FF000000';
				if (diffs === 0) color = 'FFA0A0A0';
				row.getCell(columnIndex).value = itemName;
				row.getCell(columnIndex).font = {
					name: 'Arial Black',
					color: { argb: color },
					family: 2,
					size: 9,
					bold: true
				}
				for (let node of this.config.nodes) {
					let nodeName = node.name;
					let hash: string = hashList[nodeName];
					let color = 'FF000000';
					let bold = false;
					if (this.config.masterNode) {
						if (nodeName === this.config.masterNode) color = 'FF008000'; else
						if (hashList[nodeName] != hashList[this.config.masterNode]) {
							color = 'FFAA0000';
							bold = true;
							node.diffs ++;
						}
					}
					let cell = row.getCell(++columnIndex);
					cell.value = hash;
					cell.font = {
						name: 'Arial',
						color: { argb: color },
						family: 2,
						size: 8,
						bold: bold
					}
				}
				columnIndex = 2;
				let headRow = sheet.getRow(1);
				for (let node of this.config.nodes) {
					if (node.name !== this.config.masterNode) {
						let cell = headRow.getCell(columnIndex);
						let name: string = node.name + ` (diff=${node.diffs})`;
						cell.value = name;
					}
					columnIndex ++;
				}
			}
		}
		catch(error) {
			console.log(error);
		}
	}
	private sortStorage(storage: any) {
		if (!this.config.masterNode) throw 'sortStorage: masterNode not specified';
		let result = [];
		for (let item in storage) {
			let hashList = storage[item];
			let diffs: number = 0;
			for (let node of this.config.nodes) {
				if (hashList[node.name] != hashList[this.config.masterNode]) {
					diffs ++;
				}
			}
			result.push({
				name: item,
				hashList: hashList,
				diffs: diffs
			});
		}
		result.sort(function(a, b) {return b.diffs - a.diffs});
		return result;
	}
}
