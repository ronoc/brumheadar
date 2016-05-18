"use strict";
require('sugar');

let async  			= require('async')
  , config 			= require('../../common/config') 
	, crypto 			= require('crypto')
	, elastic 		= require('elasticsearch')
	, events 			= require('events')	
	, logger 			= require('../../common/logger').forFile(module.filename)	
	, path 				= require("path")
	, requireDir 	= require('require-dir')	
	, util 				= require('util')
;

let Database = require('../../common/database');

let Elasticsearch = module.exports = function(settings){
	this.settings = settings;
	this.host = util.format("http://%s:%s", config.ES_HOST, config.ES_PORT);
	this.elasticClient = new elastic.Client({host : this.host});
	this.constructor.super_.call(this);	
};

util.inherits(Elasticsearch, Database);

Elasticsearch.prototype.prepareIndices = function(indices, done){
	let self = this;
	let insertMapping = function(mapping, callback){
		// We are assuming that the mapping type is the top level key
		// in the mapping object which if it isn't it isn't formed 
		// correctly.
		let mappingType = Object.keys(mapping).first();

		async.eachSeries(indices, (indexHandle, cb) => {
			self.elasticClient.indices.putMapping({index: indexHandle, 
																						 type : mappingType,
																						 body : mapping}, cb);			
		},
		(err) => {
			callback(err);
		});
	};

	async.waterfall([
		(callback) => {
			// Just make sure to clear out the indices for a fresh start
			self.elasticClient.indices.delete({index: '_all'}, callback);
		},
		(esResponse, statusCode, callback) => {
			self.createIndices(indices, callback);
		},
		(callback) => {
			let mappings = requireDir(path.join(config.SCHEMATA, self.settings.name));		
			async.eachSeries(Object.values(mappings), insertMapping, callback);
		}
	],
	(err) => {
		done(err);
	});
};

Elasticsearch.prototype.createIndices = function(indices, done){
	var self = this;
	
	async.eachSeries(indices, function(theindex, callback){
		self.elasticClient.indices.create({index: theindex}, callback);
	}, function(err){
		done(err);
	});
};

Elasticsearch.prototype.bulkCreate = function(payload, done){
	let self = this
		, bulkInput = {body : []}
	;
	
	payload.each((entry) => {
		console.log("\n\n\n\nthis " + JSON.stringify(entry));
		let indexObj = {_index : entry._index,
		 								_type : entry._type,
		 								_id : entry._id};
		bulkInput.body.push({"create": indexObj});
		bulkInput.body.push(Object.reject(entry, ["_id"]));
	});

	let timerId = crypto.randomBytes(20).toString('hex');
	
	self.emit("started", "bulkCreate", timerId, Object.size(payload));
	self.elasticClient.bulk(bulkInput, (err, resp) => {
		if(err){
			console.log("here err " + JSON.stringify(err));
			logger.warn("err : ", JSON.stringify(err));
			self.emit("error", err, "bulkCreate");
		}
		console.log("what");
		self.emit("finished", "bulkCreate", timerId, Object.size(payload));
		done();
	});
};

Elasticsearch.prototype.bulkMulti = function(payload, done){
	let self = this
		, bulkInput = {body : []}
	;
	
	payload.create.each((entry) => {
		let indexObj = {_index : entry._index,
		 								_type : entry._type,
		 								_id : entry._id};

		bulkInput.body.push({"create": indexObj});
		bulkInput.body.push(Object.reject(entry, ["_index", "_type", "_id"]));
	});

	payload.update.each((entry) => {
		let indexObj = {_index : entry._index,
		 								_type : entry._type,
		 								_id : entry._id};
		bulkInput.body.push({"update": indexObj});
		bulkInput.body.push({"doc" : Object.reject(entry, ["_index", "_type", "_id"])});				
	});

  let finishUp = (handle, err, resp) => {
		if(err)
			self.emit("error", err, "bulkMulti");
		self.emit("finished","bulkMulti", handle, bulkInput.body.length/2);
		done(err);		
	};

	let timerId = crypto.randomBytes(20).toString('hex');
	self.emit("started", "bulkMulti", timerId, bulkInput.body.length/2);
	self.elasticClient.bulk(bulkInput, finishUp.bind(null, timerId));
};

Elasticsearch.prototype.search = function(tokens, done){
	let self = this;
};