"use strict";
require('sugar');

let async       = require("async");
let config      = require("../../common/config");
let crypto      = require('crypto');

let Indices     = require("../../indices-creator");
let logger      = require('../../common/logger').forFile(module.filename);
let requireDir  = require('require-dir');
let util        = require('util');

let Utilities = require('../../common/utilities');

let generateBasicType = function(handle, definition){
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
    case "double":
      result = Utilities.makeDouble();
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

let generateObject = function(definition){
  let result = {};
  
  Object.each(definition.properties, (key, value) => {
    if(Object.has(value, "properties")){
      result[key] = generateObject(value);
      return;
    }
    result[key] = generateBasicType(key, value);
  });
  return result;  
};

let create = function (mappings, bulkcount, bulksize){
  let bulks = [];
  
  (0).upto(bulkcount-1, (n)=>{
    let results = [];
    
    Object.each(mappings.elasticsearch, (file, mapping) => {
      let key = Object.keys(mapping).first();
      
      let weighting = mappings.weightings[key];
      let quantity = bulksize * weighting;
      
      //logger.info(util.format("Generate %s weighting %s, quantity %s",key, weighting, quantity));
      let payload = [];
      
      let currentIndex = 0;
      
      (0).upto(quantity-1, (n) => {
        let generated = generateObject(mapping[key]);
        generated._index = Indices.indices[currentIndex++ % Indices.indices.length];
        generated._type = key;
        generated._id =  crypto.randomBytes(128).toString('hex');     
        payload.push(generated);
      });
      results.push(payload);
    });
    
    bulks.push(results);
   });
   return bulks;
};

let makeUpdates = function(sampleSet){ 
  let updatedSet = [];
  
  sampleSet.each((sample) => {
    let trimmed = {};
    Object.each(sample, (key,value) => {
      if(Math.random() > 0.5)
        return;
      if(Object.isNumber(value))
        trimmed[key] = value - Math.random() * 100;
      else if(Object.isString(value))
        trimmed[key] = value.first(Math.floor(value.length * Math.random()));

      if(["_index", "_type", "_id"].some(key))
        trimmed[key] = value;
    });
    updatedSet.push(trimmed);
  });
  return updatedSet;
};

let getBatchSize = function(payload, size) {
  let flattenedS = payload.seeds.flatten();
  let flattenedF = payload.free.flatten();
  let batchSize = size >= flattenedS.length ? flattenedS.length/2 : size;   
  let randomBatchSize = Math.floor(batchSize + Math.floor(Math.random() * batchSize));
  //logger.info("random batchsize for a multi update" + randomBatchSize);
  return randomBatchSize;
};

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
  
 let result = {free : create(mappings, bulkcount, bulksize), seeds : create(mappings, 1, bulksize)};
 return result;
};
 
ESGenerator.prepareMulti = function(payload, size){
  let batchSize = size || 100;

  let flattenedS = payload.seeds.flatten();
  let flattenedF = payload.free.flatten();
    
  let prep = (type) => {
    let result;
    let set;
    switch(type){
      case "update":
        set = flattenedS.sample(getBatchSize(payload, batchSize));
        result = makeUpdates(set);
        break;
      case "delete":
        result = flattenedS.sample(getBatchSize(payload, batchSize));
        flattenedS = flattenedS.subtract(result);
        break;
      case "create":
        result = flattenedF.sample(getBatchSize(payload, batchSize));      
        break;
      default:
        logger.warn("Don't know what type of update wanted " + type);
    }
    return result || [];
  };
  let results = {};
  ["update", "create"].each((type)=> {
    results[type] = prep(type);
  });
 
  return results;  
};


