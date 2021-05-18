import {exit} from 'process';
import dotenv from 'dotenv';
dotenv.config();

import config = require('./config.json')
//import * as config from "./config.json";


import {Logger} from './logger';
export const logger = new Logger({file: false, console: true});

import {Dsl} from './dsl';
export const dsl = new Dsl('http://10.111.75.242:8082');

import {api} from './api/';
api();

import {Miner} from './miner/';
export const miner = new Miner();

miner.run();
