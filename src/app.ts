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
