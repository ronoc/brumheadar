"use strict";
require('sugar');

let config          = require('./config');
let util            = require('util');
let events          = require('events');
let logger          = require('./logger').forFile(module.filename);
let WebSocketClient = require('websocket').client;

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

    StatsD.prototype.endTimer = function(timerHandle, connection) {
      console.log("should be sending over timing data ");    
      if (timerHandle.finished !== false) {
        logger.warn('Invalid handle or timer already finished');
        return;
      }
      timerHandle.finished = true;
      let now = new Date();
      let delta = now - timerHandle.startTime;      
      this.timing(timerHandle.name, delta);
      logger.info('sending update to statsD and R ...', delta);
      
      let updateMsg = {"method":"update",
                       "data": {"dataPoint:shiny.number":delta,
                                "metric":"metricName"+timerHandle.name}
                      };
      console.log("should sending over timing data " + JSON.stringify(updateMsg));                      
      logger.info(JSON.stringify(updateMsg));
      connection.send(JSON.stringify(updateMsg));
    };
  }
  
  return client;
};

function sendSocketIOInit(connection) {
  let initMsg = {"method":"init","data":{"num:shiny.number":1,
                                          ".clientdata_output_test_width":1340,
                                          ".clientdata_output_test_height":400,
                                          ".clientdata_output_test_hidden":false,
                                          ".clientdata_pixelratio":2,
                                          ".clientdata_url_protocol":"http:",
                                          ".clientdata_url_hostname":"localhost",
                                          ".clientdata_url_port":"3279",
                                          ".clientdata_url_pathname":"/",
                                          ".clientdata_url_search":"",
                                          ".clientdata_url_hash_initial":"",
                                          ".clientdata_singletons":"",
                                          ".clientdata_allowDataUriScheme":true}};
  if (connection.connected) {
    let number = Math.round(Math.random() * 0xFFFFFF);
    logger.info("sending the init ping over socketIO");
    connection.send(JSON.stringify(initMsg));
  }
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
   
  self.client = new WebSocketClient();  
  self.statsd = getMetricsClient();
  self.client.connect('ws://localhost:5901/websocket'); 

  self.client.on('connectFailed', function(error) {
    logger.warn('Client Connect Error: ' + error.toString());
  });
  
  self.client.on('connect', (connection) => {
    self.wsConnection = connection;
    sendSocketIOInit(connection);       
    connection.on('error', function(error) {
      logger.error("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
      logger.info('Connection Closed');
    });
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        var msg = JSON.parse(message.utf8Data);
        if (msg.custom) return;
        //logger.info("Received: '" + message.utf8Data + "'");        
      }
    });  
    self.emit("ready", connection);  
  }); 
  
  self.on("ready", (connection) => {
  });

  self.on("started", (operation, id, bulkSize) => {
    var handle = "DBPerf." + self.settings.name + "." + operation;
    if(bulkSize)
      handle += "." + bulkSize;
    logger.info("set key " + operation + '.' + id);
    self.timers[operation + '.' + id] = self.statsd.startTimer(handle);
    logger.info("started timer");
  });

  self.on("finished", (operation, id, bulkSize) => {
    var handle = "DBPerf." + self.settings.name + "." + operation;
    if(bulkSize)
      handle += "." + bulkSize;
    logger.info("finished key " + operation + '.' + id);
    self.statsd.endTimer(self.timers[operation + '.' + id], self.wsConnection);
    logger.info("finished timer");
  });
/*
  self.on("error", function(error, operation){
    logger.warn("Database error, \nDB : " + self.settings.name + "\nOperation : " + operation + " \nError: " + JSON.stringify(error));    
    var handle = "DBPerf." + self.settings.name + "." + operation + ".failure";
    self.statsd.increment(handle);
  });*/

       
  /*self.on("started", (operation, id, bulkSize) => {
    var handle = "DBPerf." + self.settings.name + "." + operation;
    console.log("on started " + id);
  });*/  
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
