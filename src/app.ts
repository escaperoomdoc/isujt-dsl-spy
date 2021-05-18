import {exit} from 'process';
import dotenv from 'dotenv';
dotenv.config();

import {Logger} from './logger';
export const logger = new Logger({file: false, console: true});

import {api} from './api/';
api();

import {Miner} from './miner/';
export const miner = new Miner();

miner.run();
