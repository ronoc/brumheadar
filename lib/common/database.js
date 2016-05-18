"use strict";
require('sugar');

let config = require('./config');
let util   = require('util');
let events = require('events');
let logger = require('./logger').forFile(module.filename);

if (config.isDebug) {
  require('dotenv').load();
}

let StatsD = require('node-statsd');

function getMetricsClient() {
  let client = new StatsD(config.STATSD_HOST, config.STATSD_PORT, config.STATSD_API_KEY + '.');
  if (client.startTimer === undefined) {
    StatsD.prototype.startTimer = function(name) {
      return {name: name, startTime: new Date(), finished: false};
    };

    StatsD.prototype.endTimer = function(timerHandle) {
      if (timerHandle.finished !== false) {
        logger.warn('Invalid handle or timer already finished');
        return;
      }
      timerHandle.finished = true;
      let now = new Date();
      let delta = now - timerHandle.startTime;
      this.timing(timerHandle.name, delta);
    };
  }
  return client;
};

let Database = module.exports = function() {
  this.statsd = undefined;
  this.timers = {};
  this.init();
};

util.inherits(Database, events.EventEmitter);

//
// Signals
//

// ("started", operation) - When the database module starts an operation. It should emit this signal along with the name of the operation

// ("finished", name, operation) - When the database module finishes an operation. It should emit this signal along with the name of the operation

// ("error", err, name, operation) - When there is an error that stops the database from continuing it's work.
// 
 

Database.prototype.init = function(){
  let self = this;
  self.statsd = getMetricsClient();

  self.on("started", (operation, id, bulkSize) => {
    var handle = "DBPerf." + self.settings.name + "." + operation;
    if(bulkSize)
      handle += "." + bulkSize;
    //logger.info("set key " + operation + '.' + id);
    self.timers[operation + '.' + id] = self.statsd.startTimer(handle);
  });

  self.on("finished", (operation, id, bulkSize) => {
    var handle = "DBPerf." + self.settings.name + "." + operation;
    if(bulkSize)
      handle += "." + bulkSize;
    //logger.info("finished key " + operation + '.' + id);
    self.statsd.endTimer(self.timers[operation + '.' + id]);
  });

  self.on("error", function(error, operation){
    logger.warn("Database error, \nDB : " + self.settings.name + "\nOperation : " + operation + " \nError: " + JSON.stringify(error));    
    var handle = "DBPerf." + self.settings.name + "." + operation + ".failure";
    self.statsd.increment(handle);
  });
};

// Our subclass modules need to override these babies !
// Prepare the indices
Database.prototype.prepareIndices = function(indices, done){
  done(new Error('This method should be implemented'));
};

// Writes
Database.prototype.bulkCreate = function(bulkInsert, order, done){
  done(new Error('This method should be implemented'));
};

Database.prototype.bulkMulti = function(bulkUpdate, order, done){
  done(new Error('This method should be implemented'));
};

Database.prototype.prepareMulti = function(prepMulti, done){
  done(new Error('This method should be implemented'));
};


// Reads
Database.prototype.search = function(tokens, done){
  done(new Error('This method should be implemented'));
};

Database.prototype.aggregatedSearch = function(tokens, done){
  done(new Error('This method should be implemented'));
};

Database.prototype.scroll = function(query, done){
  done(new Error('This method should be implemented'));
};

Database.prototype.scan = function(query, done){
  done(new Error('This method should be implemented'));
};
