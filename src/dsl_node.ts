import axios from 'axios';
import {fsread, sleep} from "./app";
import {fswrite} from "./app";
import {now} from './app';

export interface IDslNodeResult {
	status: string,
	error?: string,
	payload?: any
};

export class DslNode {
	name: string;
	baseUrl: string;
	fileHashes?: string;
	fileScript?: string;
	hashesDelay: number;
	filesPolicy: any;
	hashes: any;
	timeofHashes: number;
	constructor(cfg: any, filesPolicy: any) {
		try {
			this.name = cfg.name;
			this.baseUrl = cfg.url;
			this.fileHashes = cfg.fileHashes;
			this.fileScript = cfg.fileScript;
			this.hashesDelay = 0;
			if (cfg.hashesDelay) this.hashesDelay = cfg.hashesDelay;
			this.filesPolicy = filesPolicy;
			this.timeofHashes = 0;
		}
		catch(error) {
			console.log(error);
			process.exit(1);
		}
	}
	private async get(endpoint: string, parameters?: any): Promise<IDslNodeResult> {
		try {
			if (this.filesPolicy.emulate) {
				if (this.fileHashes)
				{
					if (parameters && parameters.type_response === 'md5') {
						if (this.hashesDelay) {
							await sleep(this.hashesDelay);
						}
						let data = (await fsread(this.fileHashes as string)).toString();
						return {
							status: 'ok',
							payload: JSON.parse(data)
						}
					}
				}
				if (this.fileHashes)
				{
					if (parameters && parameters.script_name) {
						let data = (await fsread(this.fileScript as string)).toString();
						return {
							status: 'ok',
							payload: JSON.parse(data)
						}
					}
				}
				return {
					status: 'error',
					payload: null
				}
			}
			var url: string = this.baseUrl + endpoint;
			if (parameters) {
				var paramstring: string | null = null;
				for (const key in parameters) {
					if (!paramstring) paramstring = '?';
					else paramstring += '&';
					paramstring += `${key}=${parameters[key]}`;
				}
				url += paramstring;
			}
			var result = await axios.get(url);
			if (this.fileHashes && !this.filesPolicy.emulate && this.filesPolicy.rewrite && parameters && parameters.type_response === 'md5') {
				await fswrite(this.fileHashes, JSON.stringify(result.data));
			}
			if (this.fileScript && !this.filesPolicy.emulate && this.filesPolicy.rewrite && parameters && parameters.script_name) {
				await fswrite(this.fileScript, JSON.stringify(result.data));
			}
			return {
				status: 'ok',
				payload: result.data
			}
		}
		catch(error) {
			return {
				status: 'error',
				error: error
			}
		}
	}
	public async getHashes(): Promise<IDslNodeResult> {
		let result = await this.get('/ajax2.php', {
			module: 'Monitoring',
			method: 'get_dsl',
			type_response: 'md5'
		});
		this.hashes = (result.status && result.status === 'ok') ? result.payload : null;
		if (!this.hashes) {
			console.log(`${now()}: WARNING! node ${this.name} returns null hashes`);
			return this.hashes;
		}
		if (typeof this.hashes === 'string') {
			console.log(`${now()}: WARNING! node ${this.name} returns error string instead of object`);
			this.hashes = null;
		}
		return this.hashes;
	}
	public async getScript(name: string): Promise<IDslNodeResult> {
		let result = await this.get('/ajax2.php', {
			module: 'Monitoring',
			method: 'get_dsl',
			script_name: name
		});
		return (result.status && result.status === 'ok') ? result.payload : null;
	}
	public async getMethod(name: string): Promise<IDslNodeResult> {
		let result = await this.get('/ajax2.php', {
			module: 'Monitoring',
			method: 'get_dsl',
			method_name: name
		});
		return (result.status && result.status === 'ok') ? result.payload : null;
	}
};
