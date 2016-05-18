"use strict";
require('sugar');

let path   = require('path');

let config = exports;

config.isDebug = process.env !== "production";

if (config.isDebug) {
  require('dotenv').load();
}

config.DEBUG_LEVEL = process.env.DEBUG_LEVEL;
config.STATSD_HOST = process.env.STATSD_HOST;
config.STATSD_PORT = process.env.STATSD_PORT;
config.STATSD_API_KEY = process.env.STATSD_API_KEY;
config.SCHEMATA = path.join(process.cwd(), "schemata");
config.ES_HOST = process.env.ES_HOST;
config.ES_PORT = process.env.ES_PORT;