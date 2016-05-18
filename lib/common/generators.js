"use strict";
require('sugar');

let async 			= require('async')
	, config      = require('./config')
	, databases 	= require('./databases')
	, events 			= require('events')
	, fs 					= require('fs')
	, logger      = require('./logger').forFile(module.filename)
	, path 				= require('path')
	, util 				= require('util')
;

let Generators = module.exports = {};

Generators.generate = function(bulksize, bulkcount, done){
	databases.load((err, dbs) => {
		if(err)
			return done(err);
		let results = {};
		async.eachSeries(dbs, (db, cb) => {
			let targetGenerator = require(util.format("../databases/%s/%s", db.settings.name, db.settings.generator));
			results[db.settings.name] = targetGenerator.generate(bulksize, bulkcount);
			cb();
		},
		(err) => {
			if(err)
				return done(err);
			done(null, results);
		});			
	});
};	






/*this.bulkSize = bulkSize;
	this.bulkCount = bulkCount;
	this.schemas = {};
	this.nested = {};
	this.settings = undefined;
	this.payload = [];
	this.initialWrites = {};
	this.tokens = [];
	this.indices = [];
	this.currentIndex = 0;
	this.init();
};


Generator.prototype.init = function(){
	let self = this;

	self.tokens = randomWords(300).unique();
	self.indices = indices;
	self.settings = require(SCHEMAS_DIR + '/package.json');

	var jsonLoader = new JsonLoader(SCHEMAS_DIR, 1);
	jsonLoader.on('error', function(err){
		self.emit("error" , err);
	});

	jsonLoader.on('finished', function(results){
		async.each(Object.keys(results),
		 self.validate.bind(self, results),
		  function(err){
				if(err)
					return self.emit('error', err);
				self.emit('ready');
		});			
	});
}

Generator.prototype.validate = function(results, schemaPath, done){
	var self = this;

	var schemaType = schemaPath.split('/').last().split('.').first(); 

	if(schemaType === "package")
		return done();

	var isNested = schemaType.startsWith("nested");	

	if(isNested)
		schemaType = schemaType.split('-').last();


	async.waterfall([
		function(callback){
			var validated = Generator.validate(results[schemaPath]);
			callback(null, validated);
		},
		function(validated, callback){
			if(!validated)
				return callback(validated)

			if(!Object.keys(self.settings.weightings).some(schemaType) && !isNested)
				return callback(new Error("Can't find a weightings in the settings file for " + schemaType));

			if(isNested)
				self.nested[schemaType] = results[schemaPath];
			else
				self.schemas[schemaType] = results[schemaPath];
			callback();
		}
	], function(err){
			done(err);
	});
}

Generator.prototype.generate = function(done){
	var self = this;

	console.log("Generator running for " + self.settings.name);

	self.generateInitialWrites(function(err){
		if(err)
			return done(err)
		self.generateRequested(function(err){
			done(err);
		})
	});
}

/*
 * Generate requested bulk counts.
 */
/*
Generator.prototype.generateRequested = function(done){
	var self = this;

	var process = function(bulkNumber, type, cb){
		var quantity = self.bulkSize * self.settings.weightings[type];
		self.payload[bulkNumber][type] = [];
		(0).upto(quantity-1, function(n){
			var generated  = self.generateObject(self.schemas[type]);
			generated._index = self.indices[self.currentIndex++ % self.indices.length];
			generated._type = type;
			generated._id =  crypto.randomBytes(128).toString('hex');			
			self.payload[bulkNumber][type].push(generated);
		});
		cb();
	};

	(0).upto(self.bulkCount, function(bulkNumber){
		if(bulkNumber === self.bulkCount)
			return;
		self.payload[bulkNumber] = {};
		async.each(Object.keys(self.schemas), process.bind(null, bulkNumber), function(err){
			done(err);		
		});
	});
};

/*
* Regardless of the bulk count we should always create one extra bulk which is 
* to be used initially to populate the database. Then thoses entries can be used to perform
* simultaneous updates along side the inserts in the remaining bulk operations.
*/
/*
Generator.prototype.generateInitialWrites = function(done){
	var self = this;

	var process = function(type, cb){
		var quantity = self.bulkSize * self.settings.weightings[type];
		self.initialWrites[type] = [];
		var currentIndex = 0;
		(0).upto(quantity-1, function(n){
			var generated  = self.generateObject(self.schemas[type]);
			generated._index = self.indices[currentIndex++ % self.indices.length];
			generated._type = type;
			generated._id =  crypto.randomBytes(128).toString('hex');
			self.initialWrites[type].push(generated);
		});
		cb();
	};

	async.each(Object.keys(self.schemas), process, function(err){
		if(err)
			return done(err);
		done();		
	});
}


// Expecting an array with one element
Generator.prototype.generateArray = function(descriptor, recursionLevel){
	var self = this
	  , result = []
		, element = descriptor.object.first();
	;

	var arraySize = undefined;

	if(descriptor.size)
		arraySize = Math.floor(Math.random() * (descriptor.size.last() - descriptor.size.first() + 1)) + descriptor.size.first();
	else
		arraySize = 0;

	(0).upto(arraySize).each(function(n){
		var content;
		if(Generator.isBasicType(element.object))
			content = self.generateBasicType(element);
		if(Object.isObject(element.object))
			content = self.generateObject(element.object, recursionLevel);
		if(Object.isArray(element.object))
			content = self.generateArray(element,recursionLevel);
		result.push(content);
	});
	return result;
}

Generator.prototype.generateObject = function(object, recursionLevel){
	var self = this;
	// handle variable key objects
	if(Object.keys(object).some("key"))
		return self.generateObjectWithVariableKeys(object, recursionLevel);
	// handle nested objects (plus recursion)
	if(Object.keys(object).some("nested") && (recursionLevel < 2 || !recursionLevel)){
		var level = !recursionLevel ? 1 : recursionLevel+=1;
		return self.generateObject(self.nested[object.nested], level);
	}
	// let's do the top level simple ones first;
	var result = self.generateBasicTypes(object);
	var remainders = Object.keys(object).subtract(Object.keys(result));
	Object.each(_.pick(object, remainders), function(key, value){
		if(Object.isObject(value.object))
			result[key] = self.generateObject(value.object, recursionLevel);
		if(Object.isArray(value.object)){
			result[key] = self.generateArray(value, recursionLevel);
		}
	});
	return result;
}

// Handle dictionaries that have variable keys,
// For now all keys are assumed to be a basic type
Generator.prototype.generateObjectWithVariableKeys = function(object){
	var self = this
		,	result = {}
	;

	if(!Object.keys(object).some("key") || !Object.keys(object).some("value"))
		return null;

	(0).upto(Math.random() * 20).each(function(n){
		var content;
		if(Generator.isBasicType(object.value.object))
			content = self.generateBasicType(object.value);
		if(Object.isObject(object.value.object))
			content = self.generateObject(object.value.object, recursionLevel);
		if(Object.isArray(object.value.object))
			content = self.generateArray(object.value, recursionLevel);
		result[self.generateBasicType(object.key)] = content;		
	});

	return result;
}


Generator.prototype.generateBasicTypes = function(object){
	var self = this
		, result = {}
	;
	
	Object.each(object, function(key, value){ 
		if(Generator.isBasicType(value.object)){
			result[key] = self.generateBasicType(value);
		}		
	});
	return result;
}

Generator.prototype.generateBasicType = function(descriptor){
	var self = this;
	
	if(Object.isString(descriptor.object)){
		var size = Math.floor(Math.random() * (descriptor.size.last() - descriptor.size.first() + 1)) + descriptor.size.first();
		if(descriptor.type === "hash")
			return crypto.randomBytes(~~(size/2)).toString('hex');
		if(descriptor.type === "namespace")
			return self.tokens.sample(size).join('.');			
		return self.tokens.sample(size).join(' ');
	}
	else if(Object.isNumber(descriptor.object)){
		if(descriptor.type === "ts")
			return Math.floor((~~(Math.random() * Math.random() * 1000)).daysBefore('Monday').getTime()/1000);

		if(parseFloat(descriptor.object))
			return Math.random().toFixed(3);

		if(descriptor.size)
			return Math.floor(Math.random() * (descriptor.size.last() - descriptor.size.first() + 1)) + descriptor.size.first();
		return Math.floor(Math.random() * 100);
	}
	else if(Object.isBoolean(descriptor.object)){
		return (Math.random() > 0.5);
	}
}

// Static Generation helpers
Generator.isBasicType = function(instance){
	return Object.isBoolean(instance) || Object.isNumber(instance) || Object.isString(instance);
}

//TODO finish off validation
Generator.validate = function(schema){
	return true;
	
	var validateObject = function(object){
		Object.each(object, function(key, value){
			if(!Object.isObject(value) || !value.hasOwnProperty('object'))
				result = false;
		});	
	}
}*/

