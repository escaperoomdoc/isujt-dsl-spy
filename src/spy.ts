import {exit} from 'process';
import {setInterval} from 'timers';

import {logger} from './app';
import {fsread} from './app';
import {fswrite} from './app';
import {DslNode} from './dsl_node';
import * as ejs from 'exceljs';

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
				this.nodes.push(new DslNode(node, this.config.files));
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
					if (hashes) console.log(`success request from ${node.baseUrl}`);
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
	private async getdiff() {
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
		await this.excelReport(report.modules);
		//this.diffStorage(report.modules, 'modules');
		//this.diffStorage(report.classes, 'classes');
	}
	private diffStorage(storage: any, name: string) {
		let count: number = 0;
		let total: number = 0;
		let diff_list: string = '';
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
			if (diff) {
				count ++;
				diff_list = diff_list + index + '     ';
			}
			else {
				delete storage[index];
			}
		}
		console.log(`diff count on ${name} = ${count} of ${total}:`);
		console.log(diff_list)
	}
	private async excelReport(storage: any) {
		const workbook = new ejs.Workbook();
		const sheet = workbook.addWorksheet('ptk');
		try {
			// set header
			let columnIndex = 1;
			sheet.getColumn(columnIndex).width = 40;
			sheet.getColumn(columnIndex).header = 'module';
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
			for (let node of this.config.nodes) {
				node.diffs = 0;
			}
			let rowIndex = 1;
			for (let itemName in storage) {
				let hashList = storage[itemName];
				let row = sheet.getRow(++rowIndex);
				columnIndex = 1;
				row.getCell(columnIndex).value = itemName;
				row.getCell(columnIndex).font = {
					name: 'Arial Black',
					color: { argb: 'FF000000' },
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
		await workbook.xlsx.writeFile('report.xlsx');
		if (this.config.files.emulate) exit();
	}
}
