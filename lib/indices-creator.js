"use strict";
require('sugar');

let async       = require('async')
  , databases   = require('./common/databases')
  , fs          = require('fs')
  , regions     = require('country-data').regions 
;

let IndicesCreator = module.exports = {};

//TODO:
//We should maybe make this configurable at some stage
IndicesCreator.indices = Object.keys(regions).map(function(region){ return region.toLowerCase();});;

IndicesCreator.process = function(done){
  let self = this;  
  databases.load((err, dbs) => {
    if(err)
      return done(err);
    async.eachSeries(dbs, (db, cb) => {
      db.prepareIndices(IndicesCreator.indices, cb);
    },
    (err) => {
      done(err);
    });
  });
};