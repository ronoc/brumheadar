"use strict";
require('sugar');

let argv = require('yargs')
  .usage('How much load can your DB take node --harmony ')
  .example('$0 --harmony main.js -bc [bulkcount] -bs [bulksize] -m [mode]', '')
  .alias('bc', 'bulkcount')
	.alias('bs', 'bulksize')
	.alias('m', 'mode')
  .help('h')
  .alias('h', 'help')
  .describe('bc', "the number of bulks to generate")
	.describe('bs', "the size of each bulk")
	.describe('mode', "the mode to multiplex with, scatter, writeonly, readonly")
  .argv;

let async 					= require('async');
let Multiplexer     = require('./lib/multiplexer');
let logger					= require('./lib/common/logger').forFile(module.filename);

let IndicesCreator = require('./lib/indices-creator');

const BULKSIZE_DEFAULT 	= 5;
const BULKCOUNT_DEFAULT = 1;
const MODE_DEFAULT 			= "scatter";

let bulkcount		= argv.bs || BULKCOUNT_DEFAULT;
let bulksize 		= argv.bc || BULKSIZE_DEFAULT;
let mode 				= argv.m 	|| MODE_DEFAULT;

(function(){
	async.waterfall([
		(cb) => {
			IndicesCreator.process(cb);
	 	},
	 	(cb) => {
	 		Multiplexer.process(mode, bulkcount, bulksize, cb);
	 	}],
	 	(err) => {
			if(err){
				console.log("error " + err);
				logger.warn("err " + err);
				process.exit(1);
			}
			logger.info("Komplett");
			process.exit(0);
	 	});	
})();
