import {exit} from 'process';
import {setInterval} from 'timers';
import {logger} from './app';
import {fsread} from './app';
import {now} from './app';
import {fswrite} from './app';
import {DslNode} from './dsl_node';
import * as ejs from 'exceljs';
import {pget} from "./prequest";
import {ppost} from "./prequest";
import {Telegraf} from 'telegraf';
import {HttpsProxyAgent} from 'https-proxy-agent';
import * as diff from 'diff';
import md5 from 'md5';
import {diffhtml} from './diffhtml';

export class Spy {
	nodes: Array<DslNode>;
	config: any;
	cron: any;
	bot: Telegraf | null;
	jobHashesEngaged: boolean;
	jobDiffEngaged: boolean;
	constructor() {
		this.nodes = [];
		this.cron = {
			task: {h:  0, m: 40, s:  0},
			prev: {h: -1, m: -1, s: -1}
		}
		this.bot = null;
		this.jobHashesEngaged = false;
		this.jobDiffEngaged = false;
	}
	public getNode(name: string): DslNode | null {
		for (let node of this.nodes) {
			if (node.name === name) return node;
		}
		return null;
	}
	async run() {
		try {
			let cfg = (await fsread('./config.json')).toString();
			this.config = JSON.parse(cfg);
			console.log(`${now()}: isujt-dsl-spy application started...`);
			if (!this.config.requestTimeout || this.config.requestTimeout < 5000) {
				this.config.requestTimeout = 5000;
			}
			for (let node of this.config.nodes) {
				this.nodes.push(new DslNode(node, this.config.files));
			}
			if (this.config.scheduler.enabled) {
				let sl = this.config.scheduler.task.split(':');
				if (sl.length === 3) {
					this.cron.task.h = parseInt(sl[0]);
					this.cron.task.m = parseInt(sl[1]);
					this.cron.task.s = parseInt(sl[2]);
				}
				else console.log(`${now()}: scheduler task error, leaving default 00:40:00`);
				setInterval(()=> {
					let dt = new Date(Date.now());
					let h = dt.getHours();
					let m = dt.getMinutes();
					let s = dt.getSeconds();
					if (this.cron.task.h === h && this.cron.task.m === m && this.cron.task.s === s) {
						if (this.cron.prev.h !== h || this.cron.prev.m !== m || this.cron.prev.s !== s) {
							this.jobHashes();
						}
					}
					this.cron.prev.h = h;
					this.cron.prev.m = m;
					this.cron.prev.s = s;
				}, 300);
			}
			if (this.config.runJobOnStartup) {
				setTimeout(() => this.jobHashes(), 10);
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
			}
			if (this.bot) this.telegramBot();
		}
		catch(error) {
			console.log(`${now()}: ${error}`);
		}
	}
	private telegramBot() {
		if (!this.bot) return;
		this.bot.start(async ctx => {
			try {
				ctx.reply(`isujt-dsl-spy: bot started at the telegram chat ${ctx.message.chat.id}`);
				console.log(`${now()}: isujt-dsl-spy bot started at the telegram chat ${ctx.message.chat.id}`);
			}
			catch(error) {
				console.log(`${now()}: ${error}`);
			}
		})
		this.bot.command('dsl', async ctx => {
			try {
				let cmds = ctx.update.message.text.split(' ');
				if (cmds[1] === 'ping') {
					ctx.reply('dsl: pong');
				}
				if (cmds[1] === 'hashes') {
					if (this.jobHashesEngaged) throw 'update hashes job is already in progress now';
					let fromChache: boolean = true;
					if (cmds[3] && cmds[3] === 'update') fromChache = false;
					setTimeout(() => this.jobHashes(cmds[2] ? cmds[2] : null, fromChache), 10);
					ctx.reply('dsl: update hashes job started, wait several minutes...');
				}
				if (cmds[1] === 'diff' || cmds[1] === 'fulldiff') {
					if (this.jobDiffEngaged) throw 'diff job is already in progress now';
					if (cmds[2] === 'module' || cmds[2] === 'method') {
						if (!cmds[3]) throw 'script name not specified';
						if (!cmds[4]) throw 'PTK not specified';
						let targetNode: DslNode | null = this.getNode(cmds[4]);
						if (!targetNode) throw 'PTK not found';
						let masterNodeName: string = this.config.masterNode;
						if (cmds[5]) masterNodeName = cmds[5];
						let masterNode = this.getNode(masterNodeName);
						if (!masterNode) throw 'masterNode not specified in config file';
						setTimeout(() => this.jobDiff({
							type: cmds[2],
							name: cmds[3],
							targetNode: targetNode,
							masterNode: masterNode,
							full: cmds[1] === 'fulldiff' ? true : false
						}), 10);
						ctx.reply('dsl: diff job started, wait several seconds...');
					}
					else throw `diff ${cmds[2]} not implemented`
				}
			}
			catch(error) {
				let error_string: string = 'dsl error: ';
				if (typeof error === 'string') error_string += error;
				else error_string += 'smth goes wrong :('
				console.log(`${now()}: ${error_string}`);
				ctx.reply(error_string);
			}
		})					
		this.bot.launch();
		process.once('SIGINT', () => (this.bot as Telegraf).stop('SIGINT'));
		process.once('SIGTERM', () => (this.bot as Telegraf).stop('SIGTERM'));
	}
	private async jobHashes(nodeName?: string | null, fromChache?: boolean | null) {
		if (this.jobHashesEngaged) {
			console.log(`${now()}: ERROR! jobHashes in progress now!`);
			return;
		}
		try {
			this.jobHashesEngaged = true;
			console.log(`${now()}: new job started...`);
			/*
			for (let node of this.nodes) {
				if (!nodeName || nodeName === node.name) {
					await this.requestHashes(node);
				}
			}
			*/
			await Promise.all(this.nodes.map(async(node) => {
				if (!nodeName || nodeName === node.name || nodeName === 'all') {
					if (node.hashes && fromChache) console.log(`${now()}: requesting hashes for ${node.name} from cache!`);
					else await this.requestHashes(node);
				}
			}));
			await this.handleResults();
		}
		catch(error) {
			console.log(`${now()}: ${error}`);
			let error_string: string = 'dsl error: ';
			if (typeof error === 'string') error_string += error;
			else error_string += 'smth goes wrong :(';
			this.botMessage(error_string);
		}
		this.jobHashesEngaged = false;
	}
	private async jobDiff(args: any) {
		try {
			this.jobDiffEngaged = true;
			if (args.type === 'module' || args.type === 'method') {
				console.log(`${now()}: requesting '${args.name}' from ${args.masterNode.name}...`);
				let master: any = null;
				if (args.type === 'module') master = await args.masterNode.getScript(args.name);
				if (args.type === 'method') master = await args.masterNode.getMethod(args.name);
				let target: any = null;
				console.log(`${now()}: requesting '${args.name}' from ${args.targetNode.name}...`);
				if (args.type === 'module') target = await args.targetNode.getScript(args.name);
				if (args.type === 'method') target = await args.targetNode.getMethod(args.name);
				if (!master || !master.data || typeof master.data !== 'string') throw `error on node '${args.masterNode.name}' ${args.type}: ${args.name}`;
				if (!target || !target.data || typeof target.data !== 'string') throw `error on node '${args.targetNode.name}' ${args.type}: ${args.name}`;
				console.log(`${now()}: comparing...`);
				var diffResult: string = diff.createTwoFilesPatch(
					args.name + '#' + args.masterNode.name,
					args.name + '#' + args.targetNode.name,
					master.data,
					target.data,
					'', '', 
					{
						context: args.full ? 10000 : 3
					}
				);
				let fileAlias: string = `${args.name}(${args.masterNode.name}%${args.targetNode.name}).diff`;
				try {
					diffResult = await diffhtml(diffResult);
					fileAlias = `${args.name}(${args.masterNode.name}%${args.targetNode.name}).html`;
				}
				catch(error) {
					console.log(`${now()}: ${error}`);
				}
				await this.botMailing({
					type: 'document',
					fileBuffer: Buffer.from(diffResult, 'utf-8'),
					fileAlias: fileAlias
				});
			}
		}
		catch(error) {
			console.log(`${now()}: ${error}`);
			let error_string: string = 'dsl error: ';
			if (typeof error === 'string') error_string += error;
			else error_string += 'smth goes wrong :('
			this.botMessage(error_string);
		}
		this.jobDiffEngaged = false;
	}	
	private async requestHashes(node: DslNode) {
		try {
			console.log(`${now()}: requesting hashes from ${node.name}: ${node.baseUrl}...`);
			let hashes = await node.getHashes();
			if (hashes) {
				node.timeofHashes = Date.now();
				console.log(`${now()}: success request from ${node.name}: ${node.baseUrl}`);
			}
			else throw `error in request from ${node.name}: ${node.baseUrl}`;
			if (this.config.server && this.config.server.enabled) {
				await this.forwardHashes(node);
				console.log(`${now()}: success forwarding to ${this.config.server.urlForwarding}`);
			}
		}
		catch(error) {
			console.log(`${now()}: ${error}`);
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
			console.log(`${now()}: ${error}`);
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
					console.log(`${now()}: received task '${task.task}': ${task.name}`);
					let data: any = {
						method: 'content',
						type: 'module',
						name: task.name,
						payload: {}
					};
					for (let node of this.nodes) {
						console.log(`${now()}: loading script '${node.name}': ${task.name}...`);
						let scriptResult: any = await node.getScript(task.name);
						data.payload[node.name] = scriptResult && scriptResult.data ? scriptResult.data : null;
					}
					//await fswrite('test.json', JSON.stringify(data));
					//let result: any = await axios.post(this.config.server.urlForwarding, data, {httpsAgent: httpsAgent});
					console.log(`${now()}: forwarding scripts to server ${this.config.server.urlForwarding}...`);
					let result: any = await ppost(this.config.server.urlForwarding, JSON.stringify(data), this.config.proxy.enabled ? this.config.proxy.url : null);
					console.log(`${now()}: handled task '${task.task}': ${task.name}`);
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
			console.log(`${now()}: ${error}`);
		}
		setTimeout(() => this.tasks(), this.config.server.tasksTimeout);
	}
	private async handleResults() {
		let master = null;
		var report: any = {
			modules: {},
			methods: {},
			classes: {},
			files: {}
		};
		for (let node of this.nodes) {
			if (!node.hashes) continue;
			if (node.hashes.data.modules)
			for (let item in node.hashes.data.modules) {
				if (report.modules[item] === undefined) report.modules[item] = {};
				report.modules[item][node.name] = node.hashes.data.modules[item];
			}
			if (node.hashes.data.methods_hash)
			for (let module in node.hashes.data.methods_hash) {
				// raw module hash
				let moduleAlias: string = '[' + module + ']';
				if (report.methods[moduleAlias] === undefined) report.methods[moduleAlias] = {};
				report.methods[moduleAlias][node.name] = node.hashes.data.modules[module];
				// attributes hash
				let moduleAttrAlias: string = module + '::attributes';
				if (report.methods[moduleAttrAlias] === undefined) report.methods[moduleAttrAlias] = {};				
				if (node.hashes.data.modules_attrs && node.hashes.data.modules_attrs[module] && Object.keys(node.hashes.data.modules_attrs[module]).length > 0) {
					report.methods[moduleAttrAlias][node.name] = md5(JSON.stringify(node.hashes.data.modules_attrs[module]));
				}
				else report.methods[moduleAttrAlias][node.name] = 'null';
				// module methods
				if (node.hashes.data.methods_hash[module])
				for (let method in node.hashes.data.methods_hash[module]) {
					let methodAlias: string = module + '.' + method;
					if (report.methods[methodAlias] === undefined) report.methods[methodAlias] = {};
					report.methods[methodAlias][node.name] = node.hashes.data.methods_hash[module][method];
				}
			}
			if (node.hashes.data.classes)
			for (let item in node.hashes.data.classes) {
				if (report.classes[item] === undefined) report.classes[item] = {};
				report.classes[item][node.name] = node.hashes.data.classes[item];
			}
			let fileCount: number = 0;
			if (node.hashes.data.file)
			for (let item of node.hashes.data.file) {
				fileCount ++;
				if (!item) continue;
				if (!Array.isArray(item)) throw `${node.name}(${fileCount}) not array file-object detected`;
				if (report.files[item[0]] === undefined) report.files[item[0]] = {};
				report.files[item[0]][node.name] = item[1];
			}			
		}
		if (this.config.excelReport) {
			await this.excelReport(report);
			await this.botMailing({
				type: 'document',
				fileName: './report.xlsx',
				fileAlias: './hash-report.xlsx'
			});
		}
	}
	private async botMailing(args: any) {
		if (!this.bot) return;
		try {
			let chatsArray = this.config.telegram.chats;
			if (args.type === 'document') {
				let data: any = null;
				if (args.fileBuffer) data = args.fileBuffer;
				if (args.fileName) data = await fsread(args.fileName);
				for (const chat of chatsArray) {
					await this.bot.telegram.sendDocument(chat, {
						source: data,
						filename: args.fileAlias
					});
				}
			}
			if (args.type === 'message') {
				for (const chat of chatsArray) {
					await this.bot.telegram.sendMessage(chat, args.message);
				}				
			}
		}
		catch(error) {
			console.log(`${now()}: ${error}`);
		}
	}
	private async botMessage(message: string) {
		await this.botMailing({
			type: 'message',
			message: message
		})
	}
	private async excelReport(report: any) {
		try {
			const workbook = new ejs.Workbook();
			this.excelReportSheet(workbook, report.modules, 'modules');
			this.excelReportSheet(workbook, report.methods, 'methods');
			this.excelReportSheet(workbook, report.classes, 'classes');
			this.excelReportSheet(workbook, report.files, 'files');
			await workbook.xlsx.writeFile('report.xlsx');
			console.log(`${now()}: excel report successfuly generated`);
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
			// set dates of update
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
			// set values...
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
					name: sheetName === 'methods' && itemName[0] !== '[' ? 'Arial' :'Arial Black',
					color: { argb: color },
					family: 2,
					size: sheetName === 'methods' && itemName[0] !== '[' ? 7 : 9,
					bold: sheetName === 'methods' && itemName[0] !== '[' ? false : true
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
			console.log(`${now()}: ${error}`);
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
