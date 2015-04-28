var cluster = require('cluster');
var crypto = require('crypto');
var pearson = require('../');

if (cluster.isMaster){
	var numCPUs = require('os').cpus().length;

	//Getting a random seed for pearson
	var theSeed = pearson.seed();
	console.log('Generated seed:\n' + theSeed.toString('hex'));

	//Generating random data to be collisionned
	var d = randomData();
	console.log('Attempting to collision: ' + d.toString('hex'));

	//Setting up cluster parameters
	cluster.setupMaster({
		args: [theSeed.toString('hex'), d.toString('hex')]
	});

	//Start time :
	var startTime = process.hrtime();

	var workers = []
	//Spawnning workers
	for (var i = 0; i < numCPUs; i++){
		var newWorker = cluster.fork();
		newWorker.once('message', msgHandler);
		workers.push(newWorker);
	}

	function msgHandler(m){
		var collision = m;
		//var msgParts = m.split(/\r\n/);
		//var collision = msgParts[0];
		//var attempts = Number(msgParts[1]);
		console.log('Collision found: ' + m);
		var endTime = process.hrtime(startTime);
		var elapsedTime = endTime[0] + endTime[1] / 1e9;
		console.log('Elapsed time: ' + elapsedTime + ' seconds');

		//Getting number of attempts from each worker, and then killing them
		var count = 0;
		var stopped = 0;

		while (workers.length > 0){
			var currentWorker = workers[0];
			try {
				currentWorker.removeAllListeners();
				currentWorker.once('message', function(c){
					c = Number(c);
					count += c;
					currentWorker.kill();
					stopped++;
				});
				currentWorker.send('stop');
			} catch (e){

			}
			workers.splice(0, 1);
		}
		setInterval(function(){
			if (stopped == numCPUs) process.exit();
		}, 50);
	}
} else {
	var seed = new Buffer(cluster.worker.process.argv[2], 'hex');
	var dataToCollision = new Buffer(cluster.worker.process.argv[3], 'hex');
	var attempt;
	var count = 0;
	var stop = false;
	//Binding message events
	cluster.worker.on('message', function(msg){
		if (msg == 'stop'){
			stop = true;
			cluster.worker.send(count.toString());
		}
	});

	do {
		attempt = randomData();
		count++;
	} while (pearson(attempt, undefined, seed) != pearson(dataToCollision, undefined, seed) && !stop);

	if (!stop){ //If stop hasn't been set to true, that means the worker has found a collision
		cluster.worker.send(attempt.toString('hex'));
		//cluster.worker.send('\r\n' + count.toString());
	}
}


function randomData(){
	var dLength = Math.ceil(16 * Math.random());
	return crypto.pseudoRandomBytes(dLength);
}
