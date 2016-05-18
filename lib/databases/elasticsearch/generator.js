"use strict";
require('sugar');

let async       = require("async");
let config      = require("../../common/config");
let crypto 			= require('crypto');

let Indices 		= require("../../indices-creator");
let logger      = require('../../common/logger').forFile(module.filename);
let requireDir  = require('require-dir');
let util        = require('util');

let Utilities = require('../../common/utilities');

let ESGenerator = module.exports = {};

ESGenerator.generate = function(bulkcount, bulksize){ 
	let mappings;
	try{
		mappings = requireDir(config.SCHEMATA, {recurse: true});
	}
	catch(err){
		logger.warn("Unable to load Schemas from provided SCHEMATA dir " + config.SCHEMATA);
		throw(err);
	} 
	
	if(!Object.has(mappings, "elasticsearch")){
		logger.warn("No mappings for Elasticsearch");
    throw(new Error("no ES mappings ?"));
  }
  
 let result = {payload : ESGenerator.create(mappings, bulkcount, bulksize), seeds : ESGenerator.create(mappings, 1, bulksize)};
 return result;
};
 
 ESGenerator.create = function (mappings, bulkcount, bulksize){
  let bulks = [];
  
 	(0).upto(bulkcount-1, (n)=>{
    let results = [];
    
    Object.each(mappings.elasticsearch, (file, mapping) => {
      let key = Object.keys(mapping).first();
      
      let weighting = mappings.weightings[key];
      let quantity = bulksize * weighting;
      
      //logger.info(util.format("Generate %s weighting %s, quantity %s",key, weighting, quantity));
      let payload = {};
      payload[key] = [];
      
      let currentIndex = 0;
      
      (0).upto(quantity-1, (n) => {
        let generated = ESGenerator.generateObject(mapping[key]);
			  generated._index = Indices.indices[currentIndex++ % Indices.indices.length];
		  	generated._type = key;
			  generated._id =  crypto.randomBytes(128).toString('hex');			
        payload[key].push(generated);
      });
      results.push(payload);
    });
    
    bulks.push(results);
   });
   return bulks;
};

ESGenerator.generateObject = function(definition){
  let result = {};
  
  Object.each(definition.properties, (key, value) => {
    if(Object.has(value, "properties")){
      result[key] = ESGenerator.generateObject(value);
      return;
    }
    result[key] = ESGenerator.generateBasicType(key, value);
  });
  return result;  
};
 
ESGenerator.generateBasicType = function(handle, definition){
  let result;
  switch(definition.type){
    case "string":
      result = Utilities.makeString();
      break;
    case "long":
      result = Utilities.makeLong();
      break;
    case "float":
      result = Utilities.makeFloat();
      break;
    case "integer":
      result = Utilities.makeInteger();
      break;      
    case "boolean":
      result = Utilities.makeBool();
      break;
    default:
      return "I DON'T KNOW WHAT THIS IS";
  }
  return result;
};



