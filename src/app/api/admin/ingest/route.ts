import { NextResponse } from 'next/server';
import { runIngestion } from '@/server/ingest';

export async function POST() {
	try {
		await runIngestion();
		return NextResponse.json({ ok: true });
	} catch (e) {
		return NextResponse.json({ ok: false, error: 'ingest_failed' }, { status: 500 });
	}
}