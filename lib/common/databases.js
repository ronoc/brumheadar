"use strict";
require('sugar');

let async       = require('async')
  , path        = require('path')
  , requireDir  = require('require-dir')
;

let Databases = module.exports = {};

Databases.load = function(done){
  let result = [];
  let databases = requireDir('../databases', {recurse: true});
  Object.each(databases, (name, dbSettings) => {
    let dbMain = require(path.join(process.cwd(), 'lib', 'databases', name, dbSettings.package.main));
    result.push(new dbMain(dbSettings.package));
  });
  done(null, result);
};
