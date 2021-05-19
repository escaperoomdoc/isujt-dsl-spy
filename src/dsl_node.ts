import axios from 'axios';
import {fsread} from "./app";

export interface IDslNodeResult {
	status: string,
	error?: string,
	payload?: any
};

export class DslNode {
	name: string;
	baseUrl: string;
	jsonFile?: string;
	master?: boolean;
	hashes: any;
	constructor(cfg: any) {
		try {
			this.name = cfg.name;
			this.baseUrl = cfg.url;
			this.jsonFile = cfg.file;
			this.master = cfg.master ? true : false;
		}
		catch(error) {
			console.log(error);
			process.exit(1);
		}
	}
	private async get(endpoint: string, parameters?: any): Promise<IDslNodeResult> {
		try {
			if (this.jsonFile) {
				let data = (await fsread(this.jsonFile)).toString();
				return {
					status: 'ok',
					payload: JSON.parse(data)
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
			return {
				status: 'ok',
				payload: result.data.payload
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
