"use strict";
require('sugar');

let async 			= require('async')
	, config      = require('./config')
	, databases 	= require('./databases')
	, events 			= require('events')
	, fs 					= require('fs')
	, logger      = require('./logger').forFile(module.filename)
	, path 				= require('path')
	, util 				= require('util')
;

let Generators = module.exports = {};

Generators.generate = function(bulkcount, bulksize, done){
	databases.load((err, dbs) => {
		if(err)
			return done(err);
		let results = {};
		async.eachSeries(dbs, (db, cb) => {
			let targetGenerator = require(util.format("../databases/%s/%s", db.settings.name, db.settings.generator));
			results[db.settings.name] = targetGenerator.generate(bulkcount, bulksize);
			cb();
		},
		(err) => {
			if(err)
				return done(err);
			done(null, results);
		});
	});
};	

