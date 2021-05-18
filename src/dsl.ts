import axios from 'axios';

export interface IDslResult {
	status: string,
	error?: string,
	payload?: any
};

export class Dsl {
	baseUrl: string;
	constructor(baseUrl: string) {
		try {
			this.baseUrl = baseUrl;
		}
		catch(error) {
			console.log(error);
			process.exit(1);
		}
	}
	private async get(endpoint: string, parameters?: any): Promise<IDslResult> {
		try {
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
	public async md5(): Promise<IDslResult> {
		return await this.get('/ajax2.php', {
			module: 'Monitoring',
			method: 'get_dsl',
			type_response: 'md5'
		});
	}
	public async script(name: string): Promise<IDslResult> {
		return await this.get('/ajax2.php', {
			module: 'Monitoring',
			method: 'get_dsl',
			script_name: name
		});
	}
};
