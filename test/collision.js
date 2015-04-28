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
		var msgParts = m.split(/\r\n/);
		var collision = msgParts[0];
		var attempts = Number(msgParts[1]);
		console.log('Collision found: ' + collision);
		var endTime = process.hrtime(startTime);
		var elapsedTime = endTime[0] + endTime[1] / 1e9;
		console.log('Elapsed time: ' + elapsedTime + ' seconds');

		//Getting number of attempts from each worker, and then killing them
		var count = attempts;
		var stopped = 1;

		while (workers.length > 0){
			var currentWorker = workers[0];

			try {
				currentWorker.removeAllListeners();
				currentWorker.once('message', function(c){
					console.log('cb: ' + c);
					c = Number(c);
					count += c;
					currentWorker.kill();
					stopped++;
				});
				currentWorker.send('stop');
				console.log('Stop sent');
			} catch (e){
				console.error(e);
				process.exit(1);
			}
			workers.splice(0, 1);
		}
		setInterval(function(){
			if (stopped == numCPUs){
				console.log('Number of trials before collision: ' + count);
				process.exit();
			}
		}, 50);
	}
} else {
	var pid = cluster.worker.process.pid;
	function log(m){console.log('[' + pid + '] ' + m)};

	var seed = new Buffer(cluster.worker.process.argv[2], 'hex');
	var dataToCollision = new Buffer(cluster.worker.process.argv[3], 'hex');
	var attempt;
	var count = 0;

	//Binding message events
	cluster.worker.on('message', function(msg){
		if (msg == 'stop'){
			log('Stopping');
			log('Count: ' + count);
			cluster.worker.send(count.toString());
			cluster.worker.process.exit();
		}
	});

	do {
		attempt = randomData();
		count++;
	} while (!bufEquals(pearson(attempt, 2, seed), pearson(dataToCollision, 2, seed)));

	cluster.worker.send(attempt.toString('hex') + '\r\n' + count.toString());
}

function bufEquals(b1, b2){
	if (!(Buffer.isBuffer(b1) && Buffer.isBuffer(b2))) return false;
	if (b1.length != b2.length) return false;
	for (var i = 0; i < b1.length; i++) if (b1[i] != b2[i]) return false;
	return true;
}

function randomData(){
	var dLength = Math.ceil(16 * Math.random());
	return crypto.pseudoRandomBytes(dLength);
}
