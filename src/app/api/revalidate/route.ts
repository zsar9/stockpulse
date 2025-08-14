import { NextResponse } from 'next/server';
import { runIngestion } from '@/server/ingest';
import { getMetaLastUpdated } from '@/server/db';

export async function POST() {
	await runIngestion();
	const lastUpdated = await getMetaLastUpdated();
	return NextResponse.json({ ok: true, lastUpdated });
}