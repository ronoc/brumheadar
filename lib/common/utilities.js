"use strict";
require('sugar');

let bignum      = require('bignum');
let config      = require('./config');
let crypto      = require('crypto'); 
let util        = require('util');

const MAXIMUM_STRING_LENGTH = 256;
const MAXIMUM_LONG_LENGTH = bignum.pow(2, 63).sub(1).toNumber();
const MAXIMUM_DOUBLE_PRECISION = 17;
const MAXIMUM_NUMBER_LENGTH = 10; // 10 mill
const MAX_FLOAT_PRECISION   = 4;

let Utilities = module.exports = {};

// Let's keep the way we make stuff up generic across all generators

Utilities.makeString = function(length){
  let size = length;

  if(!size)
    size = Math.floor(Math.random() * MAXIMUM_STRING_LENGTH);

  return crypto.randomBytes(~~(size/2)).toString('hex');
};

Utilities.makeLong = function(){
  return bignum.rand(MAXIMUM_LONG_LENGTH).toNumber();  
};

Utilities.makeInteger = function(){
  return Math.floor(Math.random() * MAXIMUM_NUMBER_LENGTH);
};

Utilities.makeDouble = function(){
  return parseFloat(Math.random().toFixed(MAXIMUM_DOUBLE_PRECISION * Math.random()));
};

Utilities.makeFloat = function(precision){
  let p = precision;

  if(!p)
    p = MAX_FLOAT_PRECISION;
  
 return parseFloat(Math.random().toFixed(p * Math.random()));
};

Utilities.makeBool = function(){
  return Math.random() > 0.5;
};

