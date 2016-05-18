"use strict";

let config  = require("./config");
let winston = require('winston');
let util    = require('util');

let levels = {
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5
};

let colors = {
  trace: 'white',
  debug: 'blue',
  info: 'green',
  warn: 'yellow',
  error: 'red'
};

winston.addColors(colors);

let logger = new (winston.Logger)({transports: [
    new winston.transports.Console({
      handleExceptions: true,
      colorize: true,
      timestamp: true
    })
  ],
  exitOnError: false,
  levels: levels });
  
let level       = config.DEBUG_LEVEL || 'trace';
let DEBUG_LEVEL = levels[level];

function lineNumber() {
  return (new Error()).stack.split('\n')[3].match(/:([0-9]+):/)[1];
}

function functionName() {
  try {
    return (new Error()).stack.split('\n')[3].match(/at (\w+(\.<?[\w\b]+>?)*)/)[1];
  } catch(e)
  {
    return '';
  }
}

function getWinstonTimestampValue() {
  return  Date.create().format('{HH}:{mm}:{ss}');
}

let Logger = function(filename) {
  this.prefix_ = filename + ':';
  this.logger_ = logger;
};

Logger.prototype.trace = function () {
  if (DEBUG_LEVEL > levels.trace) return;
  let string = util.format.apply(null, arguments);
  this.logger_.trace(this.prefix_ + lineNumber() + ':' + functionName() + ': ' + string);
};

Logger.prototype.debug = function () {
  if (DEBUG_LEVEL > levels.debug) return;
  let string = util.format.apply(null, arguments);
  this.logger_.debug(this.prefix_ + lineNumber() + ':' + functionName() + ': ' + string);
};

Logger.prototype.info = function() {
  if (DEBUG_LEVEL > levels.info) return;
  let string = util.format.apply(null, arguments);
  this.logger_.info(this.prefix_ + ': ' + string);
};

Logger.prototype.log = function() {
  this.info.apply(this, arguments);
};

Logger.prototype.warn = function() {
  let string = util.format.apply(null, arguments);
  this.logger_.warn(this.prefix_ + lineNumber() + ': ' + string);
};

Logger.prototype.error = function() {
  let args = Array.prototype.slice.call(arguments, 0);
  let string = util.format.apply(null, arguments);
  let errorString = this.prefix_ + lineNumber() + ': ' +  string;
  let error = args.find(function (v) { return v instanceof Error; });
  if (!!error) {
    // an error was passed into the arguments list, so lets sugar the
    // displayed message with a little more than an error message.
    errorString += '\n';
    errorString += error.stack;
  }

  this.logger_.error(errorString);
};

exports.forFile = function(filename) {
  filename = filename.split('/').last();
  return new Logger(filename);
};
