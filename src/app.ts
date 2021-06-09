import {exit} from 'process';
import {promisify} from "util";
import * as fs from "fs";
import https from 'https';

export const sleep = promisify(setTimeout);
export const fsread = promisify(fs.readFile)
export const fswrite = promisify(fs.writeFile)

export const httpsAgent = new https.Agent({  
	rejectUnauthorized: false
});

import dotenv from 'dotenv';
dotenv.config();

import {Logger} from './logger';
export const logger = new Logger({file: false, console: true});

import {Spy} from './spy';
export const spy = new Spy();
spy.run();

/*
// debug: temp http server
import express, {Application, Request, Response, NextFunction} from 'express';
import http from 'http';
var app: Application = express();
var httpServer: http.Server = http.createServer(app);
app.use(express.json({limit: '50MB'}));
app.all('*', async (req: Request, res: Response, next: NextFunction) => {
	return res.status(200).json(null);
});
const httpServerPort = 80;
httpServer.listen(httpServerPort, () => {
   console.log(`tinmine started on ${httpServerPort}...`);
});
// handle server error on startup
httpServer.on('error', (e: any) => {
   if (e.code === 'EADDRINUSE') {
      console.log(`cannot start tinmine on ${httpServerPort}...`);
      process.exit(1);
   }
})
*/
