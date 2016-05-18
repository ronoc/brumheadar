"use strict";
require('sugar');

let async       = require('async');
let databases   = require('./common/databases');
let logger      = require('./common/logger').forFile(module.filename);
let Generators  = require('./common/generators');

let Multiplexer = module.exports = {};

Multiplexer.seed = function(databases, payload, done){
  async.each(databases, (database, callback) => {
		database.bulkCreate(payload[database.settings.name].seeds, callback);
	},
	function(err){
    logger.warn("seeding error " + JSON.stringify(err));
		done(err);
	});
};

Multiplexer.multi = function(databases, payload, done){
  done();
};

Multiplexer.process = function(mode, bulkcount, bulksize, done){
  Generators.generate(bulkcount, bulksize, (err, payload) => {
    if(mode === "scatter") // which of course it is. 
      Multiplexer.scatter(payload, done);
  });
};

Multiplexer.scatter = function(bulk, done){
  logger.info("Scatter");
  async.waterfall([
    (cb) => {
      databases.load(cb);    
    },
    (dbs, cb) => {
      Multiplexer.seed(dbs, bulk, cb);
    },
    (cb) =>{
      //Multiplexer.multi(dbs, bulk, cb);
    }
  ],
  (err) => {
    done(err);
  });
};