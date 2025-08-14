#!/usr/bin/env -S node
import cron from 'node-cron';
import { runIngestion } from '../src/server/ingest';

async function run() {
	await runIngestion();
	console.log('Ingestion complete at', new Date().toISOString());
}

if (process.env.RUN_ONCE === '1') {
	run().catch(err => { console.error(err); process.exitCode = 1; });
} else {
	cron.schedule('0 13 * * *', () => {
		run().catch(console.error);
	});
	console.log('Cron scheduled: 13:00 UTC daily');
}