import {exit} from 'process';
import {promisify} from "util";
import * as fs from "fs";

export const sleep = promisify(setTimeout);
export const fsread = promisify(fs.readFile)

import dotenv from 'dotenv';
dotenv.config();

import {Logger} from './logger';
export const logger = new Logger({file: false, console: true});

//import {api} from './api';
//api();

import {Spy} from './spy';
export const spy = new Spy();
spy.run();
