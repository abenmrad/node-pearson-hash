var Buffer = require('buffer').Buffer;
var crypto = require('crypto');
var assert = require('assert');

function pearson(data, hashLength, seed){
	if (!(Buffer.isBuffer(data) || typeof data == 'string')) throw new TypeError('data must either be a string or a buffer');
	if (hashLength && !(typeof hashLength == 'number' && hashLength > 0 && hashLength <= 8 && Math.round(hashLength) == hashLength)) throw new TypeError('when defined, hashLength must be an integer number between 1 and 8 ');
	if (seed && !(Buffer.isBuffer(seed) && seed.length == 256)) throw new TypeError('when defined, seed must be a 256 bytes-long buffer');

	if (data.length == 0) throw new TypeError('data must be at least one byte long');
	if (typeof data == 'string') data = new Buffer(data, 'utf8');

	hashLength = hashLength || 8;
	var s = seed || newSeed();

	var i = 0, j = 0;
	var hash = new Buffer(hashLength);
	for (var j = 0; j < hashLength; j++){
		var h = s[(data[0] + j) % 256];
		for (var i = 1; i < data.length; i++){
			h = s[(h ^ data[i])];
		}
		hash[j] = h;
	}
	return seed ? hash : {hash: hash, seed: s};
}

function newSeed(){
	//Generating an array containing numbers from 0 to 255
	var newSeed = new Array(256);
	for (var i = 0; i < 256; i++){
		newSeed[i] = i;
	}

	//Lets generate 256 numbers between 0.0 and 1.0
	//For each number, we're gonna use 8 bytes that we're gonna assemble as a long number and then divide by 0xffffffffffffffff
	var randomPositions = {};
	var positionsSeeds = crypto.pseudoRandomBytes(2048); // 8 * 256 = 2048
	for (var i = 0; i < 256; i++){
		var positionInLong = 0;
		for (var j = 0; j < 8; j++){
			positionInLong += Math.pow(256, j) * positionsSeeds[i * 8 + j];
		}
		var nextPosition = positionInLong / Number.MAX_VALUE;
		assert(nextPosition >= 0 && nextPosition <= 1, 'Next position must be 0 and 1, but instead we have ' + nextPosition);
		randomPositions[i.toString()] = nextPosition;
	}

	//Ordering the new seed
	newSeed.sort(function(a, b){
		var posA = randomPositions[a.toString()], posB = randomPositions[b.toString()];
		if (posA < posB) return -1;
		else if (posA > posB) return 1;
		else return 0;
	});

	//Transform the array containing the seed into a buffer
	var newSeedBuffer = new Buffer(256);
	for (var i = 0; i < 256; i++){
		newSeedBuffer[i] = newSeed[i];
	}
	return newSeedBuffer;
}

pearson.seed = newSeed;
module.exports = pearson;
