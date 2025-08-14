#!/usr/bin/env node
const cron = require('node-cron');
const http = require('http');

async function callLocalIngest() {
	return new Promise((resolve, reject) => {
		const req = http.request({ method: 'POST', hostname: 'localhost', port: 3000, path: '/api/admin/ingest' }, res => {
			let data = '';
			res.on('data', chunk => data += chunk);
			res.on('end', () => resolve({ status: res.statusCode, body: data }));
		});
		req.on('error', reject);
		req.end();
	});
}

async function run() {
	try {
		const res = await callLocalIngest();
		console.log('Triggered ingest via Next API:', res.status);
	} catch (err) {
		console.error('Failed to trigger ingest. Ensure `npm run dev` is running.');
		throw err;
	}
}

if (process.env.RUN_ONCE === '1') {
	run().catch(err => { console.error(err); process.exitCode = 1; });
} else {
	cron.schedule('0 13 * * *', () => {
		run().catch(console.error);
	});
	console.log('Cron scheduled: 13:00 UTC daily');
}