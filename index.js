'use strict';

const ReqParser = require('larvitreqparser');
const express = require('express');
const LUtils = require('larvitutils');
const minimist = require('minimist');

const lUtils = new LUtils();
const log = new lUtils.Log('verbose');
const reqParser = new ReqParser({'log': log});
const args = minimist(process.argv.slice(2));
const port = args.port;
const app = express();

if (! port) {
	console.log('Missing --port=x parameter');
	process.exit(1);
}

app.use(function (req, res, cb) {
	reqParser.parse(req, res, cb);
});

app.get('/', (req, res) => res.send('Use POST yo'));

app.post('/', function handleReq(req, res) {
	const repo = req.urlParsed.query.repo;

	let branch = 'master'; // Default to master branch
	let ended = false;

	if (! repo) {
		res.statusCode(400);
		res.send('Missing URL parameter: repo');

		log.verbose('handleReq() - Missing repo');

		return;
	}

	log.info('handleReq() - Testing repo: ' + repo);

	if (req.rawBody) {
		try {
			req.jsonBody = JSON.parse(req.rawBody.toString());
		} catch (err) {
			res.statusCode(400);
			res.send('Invalid JSON body: ' + err.message);
			ended = true;
		}

		if (ended) return;

		if (req.jsonBody.ref && req.jsonBody.req.startsWith('refs/heads/')) {
			branch = req.jsonBody.ref.substring(11);
		} else if (req.jsonBody.ref) {
			branch = req.jsonBody.ref;
		}
	}

	if (! ended) {
		res.send('Building for ' + repo + ' branch: ' + branch);
	}
});

app.listen(port, () => log.info(`Testsson is listening on port ${port}!`));
