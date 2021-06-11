import request from 'request';

export var pget = function(url: string, proxy: string) {
	return new Promise((resolve, reject) => {
		request.get({
			url: url,
			proxy: proxy
		 }, (err, res) => {
			if (err) reject(err);
			else {
				if (res.statusCode === 200) resolve(res);
				else reject(res);
			}
		})
	});
}

export var ppost = function(url: string, body: string, proxy: string) {
	return new Promise((resolve, reject) => {
		request.post({
			url: url,
			proxy: proxy,
			body: body
		 }, (err, res) => {
			if (err) reject(err);
			else {
				if (res.statusCode === 200) resolve(res);
				else reject(res);
			}
		})
	});
}
