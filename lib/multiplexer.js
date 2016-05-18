"use strict";
require('sugar');

let async       = require('async');
let databases   = require('./common/databases');
let logger      = require('./common/logger').forFile(module.filename);
let Generators  = require('./common/generators');

let Multiplexer = module.exports = {};

Multiplexer.seed = function(databases, payload, done){
  async.each(databases, (database, callback) => {
    let flattened = payload[database.settings.name].seeds.flatten().map((entry) => { return Object.values(entry);});    
		database.bulkCreate(flattened.flatten(), callback);
	},
	function(err){
    if(err){
      logger.warn("seeding error " + JSON.stringify(err));
      return done(err);
    }
		done();
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
  let dbs;
  async.waterfall([
    (cb) => {
      databases.load(cb);    
    },
    (_dbs, cb) => {
      dbs = _dbs;
      Multiplexer.seed(dbs, bulk, cb);
    },
    (cb) =>{
      Multiplexer.multi(dbs, bulk, cb);
    }
  ],
  (err) => {
    done(err);
  });
};