import axios from 'axios';
import {fsread} from "./app";
import {fswrite} from "./app";

export interface IDslNodeResult {
	status: string,
	error?: string,
	payload?: any
};

export class DslNode {
	name: string;
	baseUrl: string;
	jsonFile?: string;
	scriptFile?: string;
	filesPolicy: any;
	hashes: any;
	constructor(cfg: any, filesPolicy: any) {
		try {
			this.name = cfg.name;
			this.baseUrl = cfg.url;
			this.jsonFile = cfg.file;
			this.scriptFile = cfg.script;
			this.filesPolicy = filesPolicy;
		}
		catch(error) {
			console.log(error);
			process.exit(1);
		}
	}
	private async get(endpoint: string, parameters?: any): Promise<IDslNodeResult> {
		try {
			if (this.jsonFile && this.filesPolicy.emulate) {
				if (parameters && parameters.type_response === 'md5') {
					let data = (await fsread(this.jsonFile as string)).toString();
					return {
						status: 'ok',
						payload: JSON.parse(data)
					}
				}
				if (parameters && parameters.script_name) {
					let data = (await fsread(this.scriptFile as string)).toString();
					return {
						status: 'ok',
						payload: JSON.parse(data)
					}
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
			if (this.jsonFile && !this.filesPolicy.emulate && this.filesPolicy.rewrite) {
				await fswrite(this.jsonFile, JSON.stringify(result.data));
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
		return this.hashes = (result.status && result.status === 'ok') ? result.payload : null;
	}
	public async getScript(name: string): Promise<IDslNodeResult> {
		let result = await this.get('/ajax2.php', {
			module: 'Monitoring',
			method: 'get_dsl',
			script_name: name
		});
		return (result.status && result.status === 'ok') ? result.payload : null;
	}
};
