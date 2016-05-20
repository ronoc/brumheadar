"use strict";
require('sugar');

let async       = require('async');
let databases   = require('./common/databases');
let logger      = require('./common/logger').forFile(module.filename);
let Generators  = require('./common/generators');
let util        = require('util');

let Multiplexer = module.exports = {};

// TODO should consider testing overload of connections, i.e. don't reuse the same database object

Multiplexer.seed = function(databases, payload, done){
  async.each(databases, (database, callback) => {
    let flattened = payload[database.settings.name].seeds.flatten();
    database.bulkCreate(flattened, callback);
  },
  function(err){
    if(err){
      logger.warn("seeding error " + JSON.stringify(err));
      return done(err);
    }
    done();
  });
};

// Parrallel inserts, updates, deletes, reads, searches at the same time.
Multiplexer.dbScatter = function(database, payload, done){
  let input           = payload[database.settings.name];
  let targetGenerator = require(util.format("./databases/%s/%s",
                                            database.settings.name,
                                            database.settings.generator));
  let cycleCount  = 6;
  
  let process = (batch, cb) => {
    database.bulkMulti(batch, (err) => {
      if(err)
        return cb(err);
      input.free = input.free.subtract(batch.create);
      input.seeded = input.seeded.union(batch.create);
      cb();
    });
  };
  
  async.timesSeries(cycleCount, (n, cb) => {
    let batch = targetGenerator.prepareMulti(input);
    process(batch, cb);  
  }, (err, results) => {
    if(err){
      console.log("err : " + err);
      logger.warn(err);
      return done(err);
    }
    logger.info("finished dbscatter");
    done();
  });
};

Multiplexer.process = function(mode, bulkcount, bulksize, done){
  Generators.generate(bulkcount, bulksize, (err, payload) => {
    if(mode === "scatter") // which of course it is. 
      Multiplexer.scatter(payload, done);
  });
};

Multiplexer.scatter = function(bulk, done){
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
      async.each(dbs, (database, callback) => {      
        Multiplexer.dbScatter(database, bulk, callback);
      }, (err) => {
        cb(err);
      });
    }
  ],
  (err) => {
    done(err);
  });
};
